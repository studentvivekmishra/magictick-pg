import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (!force) {
      const tenantUser = await prisma.user.findUnique({ where: { email: 'tenant@pgnexus.com' } });
      const propertyCount = await prisma.property.count();
      if (propertyCount > 0 && tenantUser) {
        // Defensive: Reset passwords for all demo login shortcuts to ensure they always work
        const hashedPassword = bcrypt.hashSync('password123', 10);
        await prisma.user.updateMany({
          where: {
            email: {
              in: [
                'superadmin@magictick.com',
                'owner@pgnexus.com',
                'manager@pgnexus.com',
                'tenant@pgnexus.com'
              ]
            }
          },
          data: {
            passwordHash: hashedPassword,
            isActive: true
          }
        });
        return NextResponse.json({ success: true, message: 'Database already populated. Demo credentials synced.' });
      }
    }

    // 1. Clear database in dependent order to prevent foreign key errors
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

    // 2. Create the Properties
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

    // 3. Create SystemSettings for both Properties
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

    // 4. Create Users (Super Admin, Owners, Managers, Receptionists)
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    // Super Admin (No property link)
    await prisma.user.create({
      data: {
        email: 'superadmin@magictick.com',
        name: 'MagicTick CEO',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    // Property A Users
    const ownerA = await prisma.user.create({
      data: {
        propertyId: propA.id,
        email: 'owner@pgnexus.com',
        name: 'Ramesh Kumar',
        passwordHash: hashedPassword,
        role: 'OWNER',
      },
    });

    const managerA = await prisma.user.create({
      data: {
        propertyId: propA.id,
        email: 'manager@pgnexus.com',
        name: 'Vikram Singh',
        passwordHash: hashedPassword,
        role: 'MANAGER',
        salaryAmount: 18000,
        salaryPaidStatus: 'PENDING',
      },
    });

    const receptionistA = await prisma.user.create({
      data: {
        propertyId: propA.id,
        email: 'staff@pgnexus.com',
        name: 'Sneha Patel',
        passwordHash: hashedPassword,
        role: 'MANAGER',
        salaryAmount: 12000,
        salaryPaidStatus: 'PAID',
      },
    });

    // Property B Users
    await prisma.user.create({
      data: {
        propertyId: propB.id,
        email: 'owner_b@pgnexus.com',
        name: 'Sanjay Pune',
        passwordHash: hashedPassword,
        role: 'OWNER',
      },
    });

    await prisma.user.create({
      data: {
        propertyId: propB.id,
        email: 'manager_b@pgnexus.com',
        name: 'Amit Pune',
        passwordHash: hashedPassword,
        role: 'MANAGER',
        salaryAmount: 20000,
        salaryPaidStatus: 'PENDING',
      },
    });

    // 5. Create Rooms & Beds for Property A
    const r101 = await prisma.room.create({
      data: {
        propertyId: propA.id,
        roomNumber: '101',
        floor: 1,
        type: 'SINGLE',
        status: 'OCCUPIED',
        defaultPrice: 8000,
        amenitiesJson: JSON.stringify(['WiFi', 'AC', 'Attached Bathroom', 'Balcony', 'Wardrobe', 'Table', 'Chair']),
        imagesJson: JSON.stringify(['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400']),
      },
    });
    const b101A = await prisma.bed.create({
      data: { roomId: r101.id, bedNumber: '101-A', isOccupied: true },
    });

    const r102 = await prisma.room.create({
      data: {
        propertyId: propA.id,
        roomNumber: '102',
        floor: 1,
        type: 'DOUBLE',
        status: 'OCCUPIED',
        defaultPrice: 6000,
        amenitiesJson: JSON.stringify(['WiFi', 'AC', 'Attached Bathroom', 'Wardrobe', 'Table']),
        imagesJson: JSON.stringify(['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=400']),
      },
    });
    const b102A = await prisma.bed.create({
      data: { roomId: r102.id, bedNumber: '102-A', isOccupied: true },
    });
    const b102B = await prisma.bed.create({
      data: { roomId: r102.id, bedNumber: '102-B', isOccupied: false },
    });

    const r201 = await prisma.room.create({
      data: {
        propertyId: propA.id,
        roomNumber: '201',
        floor: 2,
        type: 'TRIPLE',
        status: 'VACANT',
        defaultPrice: 5000,
        amenitiesJson: JSON.stringify(['WiFi', 'Cooler', 'Fan', 'Chair']),
        imagesJson: JSON.stringify([]),
      },
    });
    const b201A = await prisma.bed.create({ data: { roomId: r201.id, bedNumber: '201-A', isOccupied: false } });
    const b201B = await prisma.bed.create({ data: { roomId: r201.id, bedNumber: '201-B', isOccupied: false } });
    const b201C = await prisma.bed.create({ data: { roomId: r201.id, bedNumber: '201-C', isOccupied: false } });

    // Rooms for Property B
    const bRoom = await prisma.room.create({
      data: {
        propertyId: propB.id,
        roomNumber: '101',
        floor: 1,
        type: 'DOUBLE',
        status: 'VACANT',
        defaultPrice: 5500,
        amenitiesJson: JSON.stringify(['WiFi']),
        imagesJson: JSON.stringify([]),
      },
    });
    await prisma.bed.create({ data: { roomId: bRoom.id, bedNumber: 'B-101-A', isOccupied: false } });

    // 6. Create Customers for Property A
    const c1 = await prisma.customer.create({
      data: {
        propertyId: propA.id,
        name: 'Aarav Sharma',
        fatherName: 'Rajesh Sharma',
        motherName: 'Sunita Sharma',
        phone: '9876543210',
        email: 'aarav.sharma@gmail.com',
        gender: 'Male',
        dob: new Date('1998-04-12'),
        occupation: 'Software Engineer',
        companyName: 'TCS',
        emergencyContactName: 'Rajesh Sharma (Father)',
        emergencyContactPhone: '9876543211',
        permanentAddress: '12, Shanti Nagar, Jaipur, Rajasthan',
        currentAddress: 'Sector 5, HSR Layout, Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        nationality: 'Indian',
        bloodGroup: 'O+',
      },
    });

    const c2 = await prisma.customer.create({
      data: {
        propertyId: propA.id,
        name: 'Priya Patel',
        fatherName: 'Arvind Patel',
        motherName: 'Kokila Patel',
        phone: '8765432109',
        email: 'priya.patel@gmail.com',
        gender: 'Female',
        dob: new Date('2000-08-22'),
        occupation: 'UI Designer',
        companyName: 'Infosys',
        emergencyContactName: 'Arvind Patel (Father)',
        emergencyContactPhone: '8765432108',
        permanentAddress: '45, Navrangpura, Ahmedabad, Gujarat',
        currentAddress: 'Sector 5, HSR Layout, Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        nationality: 'Indian',
        bloodGroup: 'B+',
      },
    });

    // 7. Create Linked Tenant user for Priya Patel
    await prisma.user.create({
      data: {
        propertyId: propA.id,
        email: 'tenant@pgnexus.com',
        name: 'Priya Patel',
        passwordHash: hashedPassword,
        role: 'TENANT',
        customerId: c2.id,
      },
    });

    // 8. Create Allocations (Property A)
    const alloc1 = await prisma.roomAllocation.create({
      data: {
        propertyId: propA.id,
        customerId: c1.id,
        roomId: r101.id,
        bedId: b101A.id,
        checkInDate: new Date('2026-05-01'),
        agreementStartDate: new Date('2026-05-01'),
        agreementEndDate: new Date('2027-04-30'),
        status: 'ACTIVE',
        rentOverride: 8000,
      },
    });

    const alloc2 = await prisma.roomAllocation.create({
      data: {
        propertyId: propA.id,
        customerId: c2.id,
        roomId: r102.id,
        bedId: b102A.id,
        checkInDate: new Date('2026-06-01'),
        agreementStartDate: new Date('2026-06-01'),
        agreementEndDate: new Date('2026-07-18'),
        status: 'ACTIVE',
        rentOverride: 5800,
      },
    });

    // 9. Deposits (Property A)
    await prisma.deposit.create({
      data: {
        roomAllocationId: alloc1.id,
        amount: 8000,
        paidAmount: 8000,
        pendingAmount: 0,
        refundStatus: 'PENDING',
      },
    });

    await prisma.deposit.create({
      data: {
        roomAllocationId: alloc2.id,
        amount: 6000,
        paidAmount: 6000,
        pendingAmount: 0,
        refundStatus: 'PENDING',
      },
    });

    // 10. Payments & Verifications (Property A)
    await prisma.payment.create({
      data: {
        propertyId: propA.id,
        customerId: c1.id,
        roomAllocationId: alloc1.id,
        dueDate: new Date('2026-05-05'),
        paidDate: new Date('2026-05-04'),
        amount: 8000,
        status: 'PAID',
        mode: 'UPI',
        transactionId: 'TXN88921820',
      },
    });
    
    await prisma.payment.create({
      data: {
        propertyId: propA.id,
        customerId: c1.id,
        roomAllocationId: alloc1.id,
        dueDate: new Date('2026-06-05'),
        paidDate: new Date('2026-06-04'),
        amount: 8000,
        status: 'PAID',
        mode: 'UPI',
        transactionId: 'TXN99213192',
      },
    });

    // Priya Patel: June Paid, July Pending Verification
    await prisma.payment.create({
      data: {
        propertyId: propA.id,
        customerId: c2.id,
        roomAllocationId: alloc2.id,
        dueDate: new Date('2026-06-05'),
        paidDate: new Date('2026-06-05'),
        amount: 5800,
        status: 'PAID',
        mode: 'BANK_TRANSFER',
        transactionId: 'TXN55928100',
      },
    });

    const pendingPayment = await prisma.payment.create({
      data: {
        propertyId: propA.id,
        customerId: c2.id,
        roomAllocationId: alloc2.id,
        dueDate: new Date('2026-07-05'),
        amount: 5800,
        status: 'PENDING',
        screenshotUrl: '/uploads/receipts/mock-txn.jpg',
        remarks: 'Transferred via GPay.',
      },
    });

    await prisma.paymentVerification.create({
      data: {
        paymentId: pendingPayment.id,
        status: 'PENDING',
      },
    });

    // 11. Rent Agreements (Property A)
    await prisma.rentAgreement.create({
      data: {
        customerId: c1.id,
        roomAllocationId: alloc1.id,
        agreementId: 'AGR-2026-101A',
        ownerName: 'Ramesh Kumar',
        ownerAadhar: '1122 3344 5566',
        ownerPan: 'ABCDE1234F',
        propertyAddress: 'MagicTick HSR PG, Sector 5, Bengaluru',
        propertyDetails: 'Room 101, Single Sharing Floor 1',
        status: 'SIGNED',
        startPeriod: new Date('2026-05-01'),
        endPeriod: new Date('2027-04-30'),
        lockInMonths: 6,
        noticePeriodDays: 30,
        superAdminStatus: 'GENERATED',
        applicationPaid: true,
        planType: 'STANDARD',
        generatedPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
    });

    // 12. Expenses (Property A)
    await prisma.expense.create({
      data: {
        propertyId: propA.id,
        category: 'ELECTRICITY',
        amount: 4500,
        date: new Date('2026-07-02'),
        remarks: 'BESCOM main grid bill for July',
        createdById: ownerA.id,
      },
    });

    await prisma.expense.create({
      data: {
        propertyId: propA.id,
        category: 'SALARY',
        amount: 8000,
        date: new Date('2026-07-01'),
        remarks: 'Receptionist Sneha Patel June salary',
        createdById: ownerA.id,
      },
    });

    // 13. Complaints (Property A)
    await prisma.complaint.create({
      data: {
        propertyId: propA.id,
        customerId: c1.id,
        category: 'WATER',
        description: 'Flush valve leaking in room 101 bathroom.',
        status: 'PENDING',
      },
    });

    // 14. Visitors (Property A)
    await prisma.visitor.create({
      data: {
        propertyId: propA.id,
        customerId: c1.id,
        visitorName: 'Sanjay Sharma',
        phone: '9898989898',
        relation: 'Cousin',
        entryTime: new Date('2026-07-14T10:00:00Z'),
        exitTime: new Date('2026-07-14T16:00:00Z'),
      },
    });

    // 15. Audit Log (Property A)
    await prisma.auditLog.create({
      data: {
        propertyId: propA.id,
        userId: ownerA.id,
        action: 'PRICE_OVERRIDE_APPROVED',
        details: 'Approved custom price override of ₹5800 for Priya Patel in room 102',
      },
    });

    // 16. Occupancy History (Property A)
    await prisma.occupancyHistory.create({
      data: { propertyId: propA.id, date: new Date('2026-03-01'), occupiedBeds: 1, totalBeds: 10, occupancyRate: 0.1 },
    });
    await prisma.occupancyHistory.create({
      data: { propertyId: propA.id, date: new Date('2026-07-01'), occupiedBeds: 2, totalBeds: 10, occupancyRate: 0.2 },
    });

    // 17. System Notification
    await prisma.notification.create({
      data: {
        title: 'Expiring Rent Agreement',
        message: 'Tenant Priya Patel (Room 102) has agreement expiring on 18th July.',
        type: 'WARNING',
        targetRole: 'ALL',
      },
    });

    return NextResponse.json({ success: true, message: 'Multi-tenant MySQL database seeded successfully!' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
