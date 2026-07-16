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

// GET: Retrieve all visitors
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.propertyId = user.propertyId || '';
    }

    const visitors = await prisma.visitor.findMany({
      where: whereClause,
      include: {
        customer: true,
      },
      orderBy: { entryTime: 'desc' },
    });

    return NextResponse.json(visitors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Check in a new visitor
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.propertyId) {
      return NextResponse.json({ error: 'Property association missing' }, { status: 400 });
    }

    const { visitorName, phone, relation, customerId, photoUrl } = await request.json();

    if (!visitorName || !phone || !relation || !customerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newVisitor = await prisma.visitor.create({
      data: {
        propertyId: user.propertyId!,
        visitorName,
        phone,
        relation,
        customerId,
        photoUrl: photoUrl || null,
        entryTime: new Date(),
      },
    });

    return NextResponse.json(newVisitor);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Check out a visitor
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { visitorId } = await request.json();

    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    // Scope check
    const visitor = await prisma.visitor.findFirst({
      where: {
        id: visitorId,
        propertyId: user.role === 'SUPER_ADMIN' ? undefined : user.propertyId || '',
      },
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor record not found in your property' }, { status: 404 });
    }

    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        exitTime: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
