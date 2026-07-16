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

// GET: Search, filter, and fetch detailed customer timeline
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL'; // ALL, ACTIVE, COMPLETED

    // Search filters: Name, Phone, Email, Nationality
    const whereClause: any = {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ],
    };

    if (user.role !== 'SUPER_ADMIN') {
      whereClause.propertyId = user.propertyId || '';
    }

    if (status !== 'ALL') {
      whereClause.allocations = {
        some: { status: status as any },
      };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        allocations: {
          include: {
            room: true,
            bed: true,
            deposit: true,
          },
        },
        documents: true,
        complaints: true,
        visitors: true,
        payments: true,
        agreements: true,
      },
      orderBy: { name: 'asc' },
    });

    // Compile dynamic chronological timeline for each customer
    const customersWithTimeline = customers.map((c) => {
      const timelineEvents: Array<{
        id: string;
        date: Date;
        type: 'CHECKIN' | 'CHECKOUT' | 'PAYMENT' | 'DEPOSIT' | 'AGREEMENT' | 'COMPLAINT' | 'VISITOR';
        title: string;
        description: string;
      }> = [];

      c.allocations.forEach((alloc) => {
        // Check-in
        timelineEvents.push({
          id: `checkin-${alloc.id}`,
          date: alloc.checkInDate,
          type: 'CHECKIN',
          title: 'Guest Checked In',
          description: `Allocated Room ${alloc.room.roomNumber} (Bed ${alloc.bed.bedNumber.split('-')[1]})`,
        });

        // Check-out (if completed)
        if (alloc.actualCheckout) {
          timelineEvents.push({
            id: `checkout-${alloc.id}`,
            date: alloc.actualCheckout,
            type: 'CHECKOUT',
            title: 'Guest Checked Out',
            description: `Checkout processed from Room ${alloc.room.roomNumber}`,
          });
        }

        // Deposit
        if (alloc.deposit) {
          timelineEvents.push({
            id: `deposit-${alloc.deposit.id}`,
            date: alloc.deposit.createdAt,
            type: 'DEPOSIT',
            title: 'Security Deposit Logged',
            description: `Amount: ₹${alloc.deposit.amount} (${alloc.deposit.refundStatus})`,
          });
        }
      });

      // Payments
      c.payments.forEach((pay) => {
        if (pay.status === 'PAID') {
          timelineEvents.push({
            id: `payment-${pay.id}`,
            date: pay.paidDate || pay.updatedAt,
            type: 'PAYMENT',
            title: 'Rent Paid',
            description: `Rent amount of ₹${pay.amount} verified via ${pay.mode || 'CASH'}. Reference: ${pay.referenceNumber || 'N/A'}`,
          });
        }
      });

      // Agreements
      c.agreements.forEach((agr) => {
        timelineEvents.push({
          id: `agreement-${agr.id}`,
          date: agr.createdAt,
          type: 'AGREEMENT',
          title: 'Rent Agreement Generated',
          description: `Agreement ID: ${agr.agreementId}. Status: ${agr.status}`,
        });
      });

      // Complaints
      c.complaints.forEach((comp) => {
        timelineEvents.push({
          id: `complaint-${comp.id}`,
          date: comp.createdAt,
          type: 'COMPLAINT',
          title: `Complaint Logged: ${comp.category}`,
          description: `Description: ${comp.description}. Status: ${comp.status}`,
        });
      });

      // Visitors
      c.visitors.forEach((vis) => {
        timelineEvents.push({
          id: `visitor-${vis.id}`,
          date: vis.entryTime,
          type: 'VISITOR',
          title: `Visitor Checked In: ${vis.visitorName}`,
          description: `Relation: ${vis.relation}. Checked in at ${vis.entryTime.toLocaleTimeString()}`,
        });
      });

      // Sort timeline events in descending chronological order
      const sortedTimeline = timelineEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        ...c,
        timeline: sortedTimeline,
      };
    });

    return NextResponse.json(customersWithTimeline);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add / Onboard a new Customer and allocate bed
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.propertyId) {
      return NextResponse.json({ error: 'Property ID missing from session.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      fatherName,
      motherName,
      phone,
      altPhone,
      email,
      gender,
      dob,
      occupation,
      companyName,
      emergencyContactName,
      emergencyContactPhone,
      permanentAddress,
      currentAddress,
      city,
      state,
      pincode,
      nationality,
      bloodGroup,
      photoUrl,
      
      // Allocation details
      roomId,
      bedId,
      checkInDate,
      agreementStartDate,
      agreementEndDate,
      rentOverride,
      depositAmount,
    } = body;

    // Check availability of bed
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed || bed.isOccupied) {
      return NextResponse.json({ error: 'Selected bed is already occupied or does not exist.' }, { status: 400 });
    }

    // Process transactions: Create customer, allocate bed, create deposit and first payment invoice
    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const newCustomer = await tx.customer.create({
        data: {
          propertyId: user.propertyId!,
          name,
          fatherName,
          motherName,
          phone,
          altPhone,
          email,
          gender,
          dob: new Date(dob),
          occupation,
          companyName,
          emergencyContactName,
          emergencyContactPhone,
          permanentAddress,
          currentAddress,
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          pincode,
          nationality: nationality || 'Indian',
          bloodGroup,
          photoUrl,
        },
      });

      // 2. Create Allocation
      const allocation = await tx.roomAllocation.create({
        data: {
          propertyId: user.propertyId!,
          customerId: newCustomer.id,
          roomId,
          bedId,
          checkInDate: new Date(checkInDate),
          agreementStartDate: new Date(agreementStartDate),
          agreementEndDate: new Date(agreementEndDate),
          rentOverride: rentOverride ? parseFloat(rentOverride) : null,
          status: 'ACTIVE',
        },
      });

      // 3. Mark Bed Occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { isOccupied: true },
      });

      // 4. Create Deposit entry
      const depAmt = parseFloat(depositAmount || '0');
      await tx.deposit.create({
        data: {
          roomAllocationId: allocation.id,
          amount: depAmt,
          pendingAmount: depAmt,
          refundStatus: 'PENDING',
        },
      });

      // 5. Create first month rent pending payment invoice
      const room = await tx.room.findUnique({ where: { id: roomId } });
      const rentValue = rentOverride ? parseFloat(rentOverride) : (room?.defaultPrice || 0);

      await tx.payment.create({
        data: {
          propertyId: user.propertyId!,
          customerId: newCustomer.id,
          roomAllocationId: allocation.id,
          dueDate: new Date(checkInDate), // Due immediately at check in
          amount: rentValue,
          status: 'PENDING',
          remarks: 'First month onboarding rent invoice',
        },
      });

      return newCustomer;
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.userId,
        action: 'CUSTOMER_ONBOARDED',
        details: `Onboarded guest ${name} (${email}) and allocated bed ${bed.bedNumber}`,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Onboarding transaction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Guest check-out or Document attachment update
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allocationId, checkoutAction, refundAmount, deductionReason, documentUpload, customerId, documentType, fileUrl } = await request.json();

    // Option A: Process Guest Checkout
    if (checkoutAction && allocationId) {
      const allocation = await prisma.roomAllocation.findFirst({
        where: {
          id: allocationId,
          propertyId: user.role === 'SUPER_ADMIN' ? undefined : user.propertyId || '',
        },
        include: { bed: true, customer: true, deposit: true },
      });

      if (!allocation || allocation.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Active allocation not found' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Mark bed vacant
        await tx.bed.update({
          where: { id: allocation.bedId },
          data: { isOccupied: false },
        });

        // 2. Set actual checkout date and status
        await tx.roomAllocation.update({
          where: { id: allocationId },
          data: {
            status: 'COMPLETED',
            actualCheckout: new Date(),
          },
        });

        // 3. Process Deposit Refund Details
        if (allocation.deposit) {
          const refundVal = parseFloat(refundAmount || '0');
          const finalDeduction = allocation.deposit.amount - refundVal;

          await tx.deposit.update({
            where: { id: allocation.deposit.id },
            data: {
              refundAmount: refundVal,
              refundDate: new Date(),
              refundStatus: finalDeduction > 0 ? 'DEDUCTED' : 'REFUNDED',
              deductionReason: deductionReason || null,
            },
          });
        }
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          propertyId: user.propertyId,
          userId: user.userId,
          action: 'CUSTOMER_CHECKOUT',
          details: `Processed checkout for ${allocation.customer.name} from Bed ${allocation.bed.bedNumber}`,
        },
      });

      return NextResponse.json({ success: true, message: 'Checkout processed successfully.' });
    }

    // Option B: Attach verified documents
    if (documentUpload && customerId && documentType && fileUrl) {
      // Validate customer property
      const targetCustomer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          propertyId: user.role === 'SUPER_ADMIN' ? undefined : user.propertyId || '',
        },
      });

      if (!targetCustomer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const doc = await prisma.document.create({
        data: {
          customerId,
          type: documentType,
          fileUrl,
          verifiedStatus: 'APPROVED',
        },
      });

      return NextResponse.json(doc);
    }

    return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Deletes guest profiles (Owner Only)
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        propertyId: user.role === 'SUPER_ADMIN' ? undefined : user.propertyId || '',
      },
      include: { allocations: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Check if customer is currently occupying a bed
    const activeStay = customer.allocations.some((a) => a.status === 'ACTIVE');
    if (activeStay) {
      return NextResponse.json({ error: 'Cannot delete a tenant with an active room stay. Please checkout first.' }, { status: 400 });
    }

    await prisma.customer.delete({ where: { id: customerId } });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.userId,
        action: 'CUSTOMER_DELETED',
        details: `Deleted customer profile ${customer.name} (${customer.email})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Customer profile deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
