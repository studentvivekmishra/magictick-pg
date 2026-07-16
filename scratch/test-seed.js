const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting debug seed...");
    
    console.log("Clearing all tables in dependent order...");
    await prisma.appQuery.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.paymentVerification.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.rentAgreement.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.visitor.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.roomAllocation.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.bed.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemSettings.deleteMany();
    await prisma.property.deleteMany();

    console.log("Wipe completed successfully! Creating Properties...");
    const propA = await prisma.property.create({
      data: {
        name: 'MagicTick HSR PG',
        slug: 'hsr-pg',
        address: 'Sector 5, HSR Layout, Bengaluru, Karnataka',
      },
    });

    const propB = await prisma.property.create({
      data: {
        name: 'Alpha Hostel',
        slug: 'alpha-hostel',
        address: 'Yerwada, Pune, Maharashtra',
      },
    });

    console.log("Creating SystemSettings...");
    await prisma.systemSettings.create({
      data: {
        propertyId: propA.id,
        pgName: 'MagicTick HSR PG',
        pgAddress: 'Sector 5, HSR Layout, Bengaluru, Karnataka',
        singleSharingPrice: 8000,
        doubleSharingPrice: 6000,
        tripleSharingPrice: 5000,
        defaultDeposit: 12000,
        rentDueDateDay: 5,
        lateFeeDaysGrace: 3,
        lateFeeFlatRate: 500,
      },
    });

    await prisma.systemSettings.create({
      data: {
        propertyId: propB.id,
        pgName: 'Alpha Hostel',
        pgAddress: 'Yerwada, Pune, Maharashtra',
        singleSharingPrice: 7500,
        doubleSharingPrice: 5500,
        tripleSharingPrice: 4500,
        defaultDeposit: 10000,
        rentDueDateDay: 10,
        lateFeeDaysGrace: 5,
        lateFeeFlatRate: 200,
      },
    });

    console.log("Creating Admin User...");
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    await prisma.user.create({
      data: {
        email: 'superadmin@magictick.com',
        name: 'MagicTick CEO',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    console.log("Seeding finished successfully!");
  } catch (error) {
    console.error("SEED CRASHED WITH ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
