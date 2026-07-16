import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to check user auth and verify Super Admin status
async function getSuperAdmin(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'SUPER_ADMIN') return null;
  return decoded;
}

// GET: Retrieve all users across all properties
export async function GET(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await prisma.user.findMany({
      include: {
        property: {
          select: { name: true },
        },
        customer: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new user for any role (Owner, Manager, Super Admin) under any property
export async function POST(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { email, name, role, propertyId, password, salaryAmount } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password || 'password123', 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        propertyId: propertyId || null,
        passwordHash: hashedPassword,
        salaryAmount: salaryAmount ? parseFloat(salaryAmount) : null,
        salaryPaidStatus: 'PENDING',
        isActive: true,
      },
    });

    const { passwordHash, ...sanitized } = newUser;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Modify details/privileges/passwords/properties of any user
export async function PUT(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId, name, role, propertyId, isActive, password, salaryAmount, salaryPaidStatus } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (propertyId !== undefined) updateData.propertyId = propertyId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (salaryAmount !== undefined) updateData.salaryAmount = salaryAmount ? parseFloat(salaryAmount) : null;
    if (salaryPaidStatus) {
      updateData.salaryPaidStatus = salaryPaidStatus;
      updateData.salaryPaidDate = salaryPaidStatus === 'PAID' ? new Date() : null;
    }
    if (password) {
      updateData.passwordHash = bcrypt.hashSync(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    const { passwordHash, ...sanitized } = updated;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Terminate any user account
export async function DELETE(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (targetUserId === admin.userId) {
      return NextResponse.json({ error: 'Cannot delete your own logged-in admin account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
