import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to check user auth and return decoded session
async function getAuthUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) return null;
  return verifyToken(token);
}

// GET: Retrieve all rooms, beds, and current allocations
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbRooms = await prisma.room.findMany({
      include: {
        beds: true,
        allocations: {
          where: { status: 'ACTIVE' },
          include: { customer: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    // Parse JSON lists for SQLite compatibility
    const parsedRooms = dbRooms.map((room) => ({
      ...room,
      amenities: JSON.parse(room.amenitiesJson || '[]'),
      images: JSON.parse(room.imagesJson || '[]'),
    }));

    return NextResponse.json(parsedRooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a room (Owner & Manager)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { roomNumber, floor, type, defaultPrice, amenities, images } = await request.json();

    if (!roomNumber || !floor || !type || !defaultPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if room number already exists
    const existing = await prisma.room.findUnique({ where: { roomNumber } });
    if (existing) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 });
    }

    // Determine number of beds based on room type
    let bedCount = 1;
    if (type === 'DOUBLE') bedCount = 2;
    if (type === 'TRIPLE') bedCount = 3;

    // Create room inside a transaction to ensure atomic bed creation
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          roomNumber,
          floor: parseInt(floor),
          type,
          defaultPrice: parseFloat(defaultPrice),
          amenitiesJson: JSON.stringify(amenities || []),
          imagesJson: JSON.stringify(images || []),
          status: 'VACANT',
        },
      });

      const bedsData = Array.from({ length: bedCount }).map((_, idx) => ({
        roomId: newRoom.id,
        bedNumber: `${roomNumber}-${String.fromCharCode(65 + idx)}`, // 101-A, 101-B
        isOccupied: false,
      }));

      await tx.bed.createMany({ data: bedsData });

      return newRoom;
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ROOM_CREATED',
        details: `Created Room ${roomNumber} (Type: ${type}) on Floor ${floor}`,
      },
    });

    return NextResponse.json(room);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Modify room details or statuses (Owner/Manager can override pricing, Receptionist can change cleaning/maintenance status)
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, defaultPrice, status, amenities, images, overrideAllocationId, rentOverrideValue } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const currentRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!currentRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Role check: Pricing overrides restricted to Owner
    if (defaultPrice !== undefined && parseFloat(defaultPrice) !== currentRoom.defaultPrice) {
      if (user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Only Owner can change default room pricing' }, { status: 403 });
      }

      // Record room pricing changes to pricing log history
      await prisma.roomPricingHistory.create({
        data: {
          roomId,
          changedById: user.userId,
          oldPrice: currentRoom.defaultPrice,
          newPrice: parseFloat(defaultPrice),
          reason: 'Periodic market pricing adjustment',
        },
      });
    }

    // Option: Override specific customer stay rent price
    if (overrideAllocationId && rentOverrideValue !== undefined) {
      if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
        return NextResponse.json({ error: 'Unauthorized override privilege' }, { status: 403 });
      }

      const updatedAlloc = await prisma.roomAllocation.update({
        where: { id: overrideAllocationId },
        data: { rentOverride: parseFloat(rentOverrideValue) },
      });

      // Write to audit log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          action: 'RENT_OVERRIDDEN',
          details: `Override rent set to ₹${rentOverrideValue} for allocation ${overrideAllocationId}`,
        },
      });

      return NextResponse.json({ success: true, updatedAllocation: updatedAlloc });
    }

    // Update Room record
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : undefined,
        status: status || undefined,
        amenitiesJson: amenities ? JSON.stringify(amenities) : undefined,
        imagesJson: images ? JSON.stringify(images) : undefined,
      },
    });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ROOM_UPDATED',
        details: `Updated Room ${currentRoom.roomNumber} fields: ${JSON.stringify({ defaultPrice, status })}`,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Deletes room records (Owner Only)
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only Owners can delete rooms' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { beds: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if any beds are occupied
    const occupied = room.beds.some((b) => b.isOccupied);
    if (occupied) {
      return NextResponse.json({ error: 'Cannot delete a room with occupied beds' }, { status: 400 });
    }

    await prisma.room.delete({ where: { id: roomId } });

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ROOM_DELETED',
        details: `Deleted Room ${room.roomNumber}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
