import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

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

// GET: Retrieve list of user accounts
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password hashes from JSON return
    const sanitizedUsers = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add new User account (Owner/Manager Only)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, name, role, customerId, password } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email address already registered' }, { status: 400 });
    }

    // Generate password hash
    const passValue = password || 'password123'; // Default temporary password
    const hashedPassword = bcrypt.hashSync(passValue, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash: hashedPassword,
        customerId: customerId || null,
        forcePasswordChange: true, // Forces password change on first login
        isActive: true,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'USER_CREATED',
        details: `Created User ${name} (${email}) with role ${role}`,
      },
    });

    const { passwordHash, ...sanitized } = newUser;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Modify details, reset passwords, or activate/deactivate accounts
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, name, role, isActive, password, forceChangeComplete } = await request.json();

    // Option A: Logged-in user resetting their own temporary password (first login flow)
    if (forceChangeComplete && password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          passwordHash: hashedPassword,
          forcePasswordChange: false,
        },
      });

      return NextResponse.json({ success: true, message: 'Password updated. Force-reset flag cleared.' });
    }

    // Option B: Administrative edits (Owner/Manager modifying other users)
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target User not found' }, { status: 404 });
    }

    // Role checks: Only Owners can modify roles/activity of Managers/Owners
    if (targetUser.role === 'OWNER' || targetUser.role === 'MANAGER') {
      if (user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Only Owners can modify Owner or Manager accounts' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (password) {
      updateData.passwordHash = bcrypt.hashSync(password, 10);
      updateData.forcePasswordChange = true; // Flag for reset force upon login
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'USER_MODIFIED',
        details: `Modified User account ${targetUser.email}. Fields updated: ${Object.keys(updateData).join(', ')}`,
      },
    });

    const { passwordHash, ...sanitized } = updatedUser;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete user account (Owner Only)
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self deletion
    if (targetUserId === user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own logged-in user account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'USER_DELETED',
        details: `Deleted User account ${targetUser.name} (${targetUser.email})`,
      },
    });

    return NextResponse.json({ success: true, message: 'User account deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
