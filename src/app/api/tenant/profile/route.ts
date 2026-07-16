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
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Allow tenants to update contact details (alternative phone, emergency contact)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'TENANT' || !user.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { altPhone, emergencyContactName, emergencyContactPhone } = await request.json();

    const updated = await prisma.customer.update({
      where: { id: user.customerId },
      data: {
        altPhone: altPhone || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
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
