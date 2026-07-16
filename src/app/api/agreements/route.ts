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

// GET: List all rent agreements and check 2-day download expiry
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agreements = await prisma.rentAgreement.findMany({
      include: {
        customer: true,
        roomAllocation: {
          include: {
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const updatedAgreements = agreements.map((agr) => {
      // Check 2-day download availability window
      const isExpired = agr.expiresAt && now > agr.expiresAt;
      return {
        ...agr,
        // If expired, indicate download is disabled
        downloadAvailable: !isExpired,
        status: isExpired ? 'EXPIRED' : agr.status,
      };
    });

    return NextResponse.json(updatedAgreements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Generate a new Rent Agreement entry
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role === 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerId,
      roomAllocationId,
      ownerName,
      ownerAadhar,
      ownerPan,
      ownerSignatureUrl,
      propertyAddress,
      propertyDetails,
      tenantSignatureUrl,
      lockInMonths,
      noticePeriodDays,
      electricityCharges,
      waterCharges,
      maintenanceCharges,
      rulesText,
    } = body;

    if (!customerId || !roomAllocationId || !ownerName || !ownerAadhar || !ownerPan) {
      return NextResponse.json({ error: 'Missing landlord or allocation inputs' }, { status: 400 });
    }

    // Load room allocation to retrieve dates, rent price, and deposit details
    const allocation = await prisma.roomAllocation.findUnique({
      where: { id: roomAllocationId },
      include: { room: true, deposit: true },
    });

    if (!allocation) {
      return NextResponse.json({ error: 'Allocation details not found' }, { status: 404 });
    }

    // Set agreement unique readable ID
    const agreementId = `AGR-${Date.now().toString().slice(-6)}`;
    const rentAmount = allocation.rentOverride || allocation.room.defaultPrice;
    const depositAmount = allocation.deposit?.amount || 0;

    // Set 2-day expiry timer for downloads
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // Expiration in 48 hours

    const newAgreement = await prisma.rentAgreement.create({
      data: {
        customerId,
        roomAllocationId,
        agreementId,
        ownerName,
        ownerAadhar,
        ownerPan,
        ownerSignatureUrl: ownerSignatureUrl || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=100', // Mock Signature Url
        propertyAddress,
        propertyDetails,
        tenantSignatureUrl: tenantSignatureUrl || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=100', // Mock Signature Url
        status: 'SIGNED',
        startPeriod: allocation.agreementStartDate,
        endPeriod: allocation.agreementEndDate,
        lockInMonths: parseInt(lockInMonths || '6'),
        noticePeriodDays: parseInt(noticePeriodDays || '30'),
        electricityCharges: electricityCharges || 'As per sub-meter (₹10/unit)',
        waterCharges: waterCharges || 'Flat ₹200/month',
        maintenanceCharges: maintenanceCharges || 'Included in rent',
        rulesText: rulesText || 'No smoking inside. Quiet hours after 10 PM. No visitor night stay without permission.',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AgreementID:${agreementId}`,
        expiresAt,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'AGREEMENT_GENERATED',
        details: `Generated Rent Agreement ${agreementId} for customer ${customerId}`,
      },
    });

    return NextResponse.json(newAgreement);
  } catch (error: any) {
    console.error('Agreement generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
