import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

// GET: Check session authentication status
export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: payload });
}

// POST: Sign in and set secure token cookie
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      value: undefined,
      where: { email },
    } as any || { where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Sign payload
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
      customerId: user.customerId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        customerId: user.customerId,
      },
    });

    // Set HTTPOnly secure cookie
    response.headers.append(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Clear session cookie (Logout)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.append(
    'Set-Cookie',
    'token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return response;
}
