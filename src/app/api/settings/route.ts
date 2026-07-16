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

// GET: Fetch System Settings
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      // Fallback fallback if seeder didn't run yet
      settings = await prisma.systemSettings.create({
        data: {},
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update System Settings (Owner Only)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const currentSettings = await prisma.systemSettings.findFirst();

    const dataToSave = {
      pgName: body.pgName || undefined,
      pgLogoUrl: body.pgLogoUrl || undefined,
      pgAddress: body.pgAddress || undefined,
      singleSharingPrice: body.singleSharingPrice !== undefined ? parseFloat(body.singleSharingPrice) : undefined,
      doubleSharingPrice: body.doubleSharingPrice !== undefined ? parseFloat(body.doubleSharingPrice) : undefined,
      tripleSharingPrice: body.tripleSharingPrice !== undefined ? parseFloat(body.tripleSharingPrice) : undefined,
      defaultDeposit: body.defaultDeposit !== undefined ? parseFloat(body.defaultDeposit) : undefined,
      rentDueDateDay: body.rentDueDateDay !== undefined ? parseInt(body.rentDueDateDay) : undefined,
      lateFeeDaysGrace: body.lateFeeDaysGrace !== undefined ? parseInt(body.lateFeeDaysGrace) : undefined,
      lateFeeFlatRate: body.lateFeeFlatRate !== undefined ? parseFloat(body.lateFeeFlatRate) : undefined,
      smtpHost: body.smtpHost || undefined,
      smtpPort: body.smtpPort !== undefined ? parseInt(body.smtpPort) : undefined,
      smtpUser: body.smtpUser !== undefined ? body.smtpUser : undefined,
      smtpPass: body.smtpPass !== undefined ? body.smtpPass : undefined,
      currencySymbol: body.currencySymbol || undefined,
      dateFormat: body.dateFormat || undefined,
    };

    let settings;
    if (currentSettings) {
      settings = await prisma.systemSettings.update({
        where: { id: currentSettings.id },
        data: dataToSave,
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: dataToSave as any,
      });
    }

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SETTINGS_UPDATED',
        details: `Updated PG system configurations & SMTP fields`,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
