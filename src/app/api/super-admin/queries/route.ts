import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to check user auth
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

// GET: Retrieve technical support queries
export async function GET(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const queries = await prisma.appQuery.findMany({
      include: {
        property: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(queries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Resolve support query
export async function PUT(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { queryId, status } = await request.json();

    if (!queryId || !status) {
      return NextResponse.json({ error: 'Query ID and status are required' }, { status: 400 });
    }

    const updated = await prisma.appQuery.update({
      where: { id: queryId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
