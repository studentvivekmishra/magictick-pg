import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// GET: Retrieve all tenant personal files, stay ledgers, and complaints
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'TENANT' || !user.customerId) {
      return NextResponse.json({ error: 'Unauthorized or not a tenant account link' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: user.customerId },
      include: {
        property: {
          include: {
            settings: true,
          },
        },
        allocations: {
          include: {
            room: true,
            bed: true,
            deposit: true,
          },
        },
        documents: true,
        complaints: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { dueDate: 'desc' },
        },
        agreements: {
          orderBy: { createdAt: 'desc' },
        },
        appQueries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Query active property managers/owners contact details
    const managers = await prisma.user.findMany({
      where: {
        propertyId: customer.propertyId,
        role: { in: ['OWNER', 'MANAGER'] },
        isActive: true,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        targetRole: { in: ['ALL', 'TENANT'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      ...customer,
      managers,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update contact details OR submit rent agreement applications
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'TENANT' || !user.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Basic profile updates
      altPhone,
      emergencyContactName,
      emergencyContactPhone,

      // Rent Agreement Application option
      submitAgreementApplication,
      ownerName,
      ownerAadhar,
      ownerPan,
      propertyAddress,
      propertyDetails,
      startPeriod,
      endPeriod,
      lockInMonths,
      noticePeriodDays,
      planType,
      paymentProofUrl,

      // Pre-existing Agreement Upload option
      uploadExistingAgreement,
      uploadedPdfUrl,
    } = body;

    // Option A: Submit a new Rent Agreement application to Super Admin
    if (submitAgreementApplication) {
      // Find active allocation to link
      const activeAlloc = await prisma.roomAllocation.findFirst({
        where: { customerId: user.customerId, status: 'ACTIVE' },
      });

      if (!activeAlloc) {
        return NextResponse.json({ error: 'You must have an active room allocation to apply for a lease.' }, { status: 400 });
      }

      const rentAgreement = await prisma.rentAgreement.create({
        data: {
          customerId: user.customerId,
          roomAllocationId: activeAlloc.id,
          agreementId: `AGR-APP-${Date.now()}`,
          ownerName: ownerName || 'N/A',
          ownerAadhar: ownerAadhar || 'N/A',
          ownerPan: ownerPan || 'N/A',
          propertyAddress: propertyAddress || 'PG Address',
          propertyDetails: propertyDetails || 'Room Allocation',
          startPeriod: startPeriod ? new Date(startPeriod) : new Date(),
          endPeriod: endPeriod ? new Date(endPeriod) : new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000), // 11 months default
          lockInMonths: lockInMonths ? parseInt(lockInMonths) : 1,
          noticePeriodDays: noticePeriodDays ? parseInt(noticePeriodDays) : 30,
          planType: planType || 'STANDARD',
          paymentProofUrl: paymentProofUrl || null,
          applicationPaid: true,
          superAdminStatus: 'PENDING',
          status: 'PENDING',
        },
      });

      return NextResponse.json({ success: true, rentAgreement });
    }

    // Option B: Tenant directly uploads pre-existing rent agreement PDF
    if (uploadExistingAgreement) {
      const activeAlloc = await prisma.roomAllocation.findFirst({
        where: { customerId: user.customerId, status: 'ACTIVE' },
      });

      if (!activeAlloc) {
        return NextResponse.json({ error: 'Active stay allocation not found' }, { status: 400 });
      }

      const rentAgreement = await prisma.rentAgreement.create({
        data: {
          customerId: user.customerId,
          roomAllocationId: activeAlloc.id,
          agreementId: `AGR-UPLOAD-${Date.now()}`,
          ownerName: 'Manually Uploaded Lease',
          ownerAadhar: 'N/A',
          ownerPan: 'N/A',
          propertyAddress: 'N/A',
          propertyDetails: 'N/A',
          startPeriod: new Date(),
          endPeriod: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000),
          lockInMonths: 1,
          noticePeriodDays: 30,
          superAdminStatus: 'GENERATED',
          status: 'SIGNED', // Instantly active
          generatedPdfUrl: uploadedPdfUrl,
        },
      });

      return NextResponse.json({ success: true, rentAgreement });
    }

    // Option C: Basic profile information update
    const updated = await prisma.customer.update({
      where: { id: user.customerId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        fatherName: fatherName || undefined,
        motherName: motherName || undefined,
        occupation: occupation || undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        permanentAddress: permanentAddress || undefined,
        currentAddress: currentAddress || undefined,
        pincode: pincode || undefined,
        nationality: nationality || undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        altPhone: altPhone !== undefined ? altPhone : undefined,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.userId,
        action: 'TENANT_PROFILE_UPDATED',
        details: `Tenant updated contact details`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
