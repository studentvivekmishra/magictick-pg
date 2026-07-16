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

// GET: Retrieve categorized expenses list
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Guard: Only Owners, Managers and Super Admins can access expense financials
    if (user.role !== 'OWNER' && user.role !== 'MANAGER' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause: any = {};
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.propertyId = user.propertyId || '';
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Record a new PG expense
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.propertyId) {
      return NextResponse.json({ error: 'Property association missing' }, { status: 400 });
    }

    const { category, amount, date, remarks } = await request.json();

    if (!category || !amount || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newExpense = await prisma.expense.create({
      data: {
        propertyId: user.propertyId!,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        remarks: remarks || null,
        createdById: user.userId,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.userId,
        action: 'EXPENSE_RECORDED',
        details: `Recorded expense of ₹${amount} under category ${category}`,
      },
    });

    return NextResponse.json(newExpense);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
