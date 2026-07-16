import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to check user auth
async function getAuthUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) return null;
  return verifyToken(token);
}

// GET: Fetch payments list, filter by status, and retrieve verification queue
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL'; // ALL, PAID, PENDING, OVERDUE
    const search = searchParams.get('search') || '';

    // Filters setup
    const whereClause: any = {};
    if (search) {
      whereClause.customer = {
        name: { contains: search },
      };
    }

    if (user.role !== 'SUPER_ADMIN') {
      whereClause.propertyId = user.propertyId || '';
    }

    if (status === 'PAID' || status === 'PENDING' || status === 'OVERDUE') {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        customer: true,
        roomAllocation: {
          include: {
            room: true,
            bed: true,
          },
        },
        verification: true,
      },
      orderBy: { dueDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Auto-generate recurring monthly invoices for all active stays
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.propertyId) {
      return NextResponse.json({ error: 'Property association missing' }, { status: 400 });
    }

    // Find all active room allocations in this property
    const activeAllocations = await prisma.roomAllocation.findMany({
      where: {
        status: 'ACTIVE',
        propertyId: user.propertyId,
      },
      include: {
        customer: true,
        room: true,
      },
    });

    const now = new Date();
    const createdCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const alloc of activeAllocations) {
        // Calculate invoice amount based on override or room pricing
        const rentAmount = alloc.rentOverride || alloc.room.defaultPrice;

        // Check if invoice already exists for this tenant for this current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const existing = await tx.payment.findFirst({
          where: {
            roomAllocationId: alloc.id,
            dueDate: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        // If no invoice generated yet for the current month, create one
        if (!existing) {
          const nextDueDate = new Date(now.getFullYear(), now.getMonth(), 5); // Due 5th of this month
          await tx.payment.create({
            data: {
              propertyId: user.propertyId!,
              customerId: alloc.customerId,
              roomAllocationId: alloc.id,
              dueDate: nextDueDate,
              amount: rentAmount,
              status: 'PENDING',
              remarks: `Auto-generated rent invoice for ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
            },
          });
          count++;
        }
      }
      return count;
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.userId,
        action: 'INVOICES_AUTO_GENERATED',
        details: `Batch-generated ${createdCount} monthly rent invoices for active stays`,
      },
    });

    return NextResponse.json({ success: true, createdInvoices: createdCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update payment status (Guest submits proof or Manager verifies screenshot)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentId,
      
      // Guest submit upload fields
      uploadReceipt,
      mode,
      referenceNumber,
      transactionId,
      screenshotUrl,
      remarks,

      // Manager verification fields
      verifyAction, // APPROVED, REJECTED, CLARIFICATION_NEEDED
      managerRemarks,
      discount,
      lateFee,
    } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Check scope
    const currentPayment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        propertyId: user.role === 'SUPER_ADMIN' ? undefined : user.propertyId || '',
      },
      include: { customer: true, verification: true },
    });

    if (!currentPayment) {
      return NextResponse.json({ error: 'Payment record not found in your property' }, { status: 404 });
    }

    // Option A: Guest submits payment proof details
    if (uploadReceipt || (transactionId && !verifyAction)) {
      const updatedPayment = await prisma.$transaction(async (tx) => {
        // Create or update verification queue item
        await tx.paymentVerification.upsert({
          where: { paymentId },
          create: {
            paymentId,
            status: 'PENDING',
          },
          update: {
            status: 'PENDING',
            verifiedAt: null,
            verifiedBy: null,
          },
        });

        // Update payment references
        return tx.payment.update({
          where: { id: paymentId },
          data: {
            mode,
            referenceNumber,
            transactionId,
            screenshotUrl,
            remarks: remarks || currentPayment.remarks,
          },
        });
      });

      return NextResponse.json({ success: true, updatedPayment });
    }

    // Option B: Manager executes Verification decision (APPROVED, REJECTED)
    if (verifyAction) {
      if (user.role === 'RECEPTIONIST') {
        return NextResponse.json({ error: 'Receptionists cannot verify payments. Owner or Manager level required.' }, { status: 403 });
      }

      const verifiedPayment = await prisma.$transaction(async (tx) => {
        // Update payment verification log status
        await tx.paymentVerification.update({
          where: { paymentId },
          data: {
            status: verifyAction,
            managerRemarks: managerRemarks || null,
            verifiedAt: new Date(),
            verifiedBy: user.name,
          },
        });

        // If approved, update payment details
        const finalDiscount = discount ? parseFloat(discount) : 0;
        const finalLateFee = lateFee ? parseFloat(lateFee) : 0;

        return tx.payment.update({
          where: { id: paymentId },
          data: {
            status: verifyAction === 'APPROVED' ? 'PAID' : 'PENDING',
            paidDate: verifyAction === 'APPROVED' ? new Date() : null,
            discount: finalDiscount,
            lateFee: finalLateFee,
          },
        });
      });

      // Write to audit log
      await prisma.auditLog.create({
        data: {
          propertyId: user.propertyId,
          userId: user.userId,
          action: 'PAYMENT_VERIFIED',
          details: `Manager ${user.name} evaluated Payment ID ${paymentId} as ${verifyAction}`,
        },
      });

      return NextResponse.json({ success: true, verifiedPayment });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
