import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// GET: Retrieve all rent agreement applications across all PGs
export async function GET(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agreements = await prisma.rentAgreement.findMany({
      include: {
        customer: true,
        roomAllocation: {
          include: {
            room: true,
            bed: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(agreements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Upload generated PDF URL and mark as GENERATED / SIGNED
export async function PUT(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { agreementId, generatedPdfUrl, status } = await request.json();

    if (!agreementId) {
      return NextResponse.json({ error: 'Agreement ID is required' }, { status: 400 });
    }

    const updated = await prisma.rentAgreement.update({
      where: { id: agreementId },
      data: {
        generatedPdfUrl: generatedPdfUrl || undefined,
        superAdminStatus: status || 'GENERATED',
        status: status === 'GENERATED' ? 'SIGNED' : undefined, // Auto-mark signed upon generation
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
