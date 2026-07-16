import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

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

// GET: Retrieve list of all Properties and their statistics
export async function GET(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const properties = await prisma.property.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
        rooms: {
          include: { beds: true },
        },
        customers: true,
      },
      orderBy: { name: 'asc' },
    });

    const enrichedProperties = properties.map((p) => {
      let totalBeds = 0;
      let occupiedBeds = 0;
      p.rooms.forEach((r) => {
        totalBeds += r.beds.length;
        occupiedBeds += r.beds.filter((b) => b.isOccupied).length;
      });

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        address: p.address,
        status: p.status,
        createdAt: p.createdAt,
        ownerName: p.users.find((u) => u.role === 'OWNER')?.name || 'N/A',
        ownerEmail: p.users.find((u) => u.role === 'OWNER')?.email || 'N/A',
        usersCount: p.users.length,
        roomsCount: p.rooms.length,
        bedsCount: totalBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      };
    });

    return NextResponse.json(enrichedProperties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new Property, SystemSettings row, and Owner User account
export async function POST(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, slug, address, ownerName, ownerEmail, ownerPassword } = await request.json();

    if (!name || !slug || !address || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const existingSlug = await prisma.property.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ error: 'Property slug/subdomain already exists' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Owner email address already registered' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(ownerPassword, 10);

    const property = await prisma.$transaction(async (tx) => {
      // 1. Create Property
      const newProp = await tx.property.create({
        data: {
          name,
          slug,
          address,
        },
      });

      // 2. Initialize SystemSettings
      await tx.systemSettings.create({
        data: {
          propertyId: newProp.id,
          pgName: name,
          pgAddress: address,
        },
      });

      // 3. Create Owner User
      await tx.user.create({
        data: {
          propertyId: newProp.id,
          email: ownerEmail,
          name: ownerName,
          passwordHash: hashedPassword,
          role: 'OWNER',
        },
      });

      return newProp;
    });

    return NextResponse.json(property);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Pause, resume, or suspend a property subscription
export async function PUT(request: Request) {
  try {
    const admin = await getSuperAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { propertyId, status } = await request.json();

    if (!propertyId || !status) {
      return NextResponse.json({ error: 'Missing propertyId or status' }, { status: 400 });
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
