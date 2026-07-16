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

// POST: Create a technical support query / bug ticket for MagicTick Super Admin
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'TENANT' || !user.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.propertyId) {
      return NextResponse.json({ error: 'Property association missing' }, { status: 400 });
    }

    const { type, subject, message } = await request.json();

    if (!type || !subject || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newQuery = await prisma.appQuery.create({
      data: {
        propertyId: user.propertyId!,
        customerId: user.customerId,
        type,
        subject,
        message,
        status: 'PENDING',
      },
    });

    return NextResponse.json(newQuery);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
