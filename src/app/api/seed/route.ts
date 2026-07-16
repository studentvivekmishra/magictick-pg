import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // 1. Clear database in correct relational order
    await prisma.systemSettings.deleteMany();
    await prisma.occupancyHistory.deleteMany();
    await prisma.roomPricingHistory.deleteMany();
    await prisma.report.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.visitor.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rentAgreement.deleteMany();
    await prisma.deposit.deleteMany();
    await prisma.paymentVerification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.roomAllocation.deleteMany();
    await prisma.user.deleteMany(); // Cascade will handle dependencies
    await prisma.customer.deleteMany();
    await prisma.bed.deleteMany();
    await prisma.room.deleteMany();

    // 2. Create Default System Settings
    await prisma.systemSettings.create({
      data: {
        pgName: 'MagicTick HSR PG',
        pgAddress: 'Sector 5, HSR Layout, Bengaluru, Karnataka',
        singleSharingPrice: 8000,
        doubleSharingPrice: 6000,
        tripleSharingPrice: 5000,
        defaultDeposit: 12000,
        rentDueDateDay: 5,
        lateFeeDaysGrace: 3,
        lateFeeFlatRate: 500,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
      },
    });

    // 3. Create Users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const owner = await prisma.user.create({
      data: {
        email: 'owner@pgnexus.com',
        name: 'Ramesh Kumar',
        passwordHash: hashedPassword,
        role: 'OWNER',
      },
    });

    const manager = await prisma.user.create({
      data: {
        email: 'manager@pgnexus.com',
        name: 'Vikram Singh',
        passwordHash: hashedPassword,
        role: 'MANAGER',
      },
    });

    const receptionist = await prisma.user.create({
      data: {
        email: 'receptionist@pgnexus.com',
        name: 'Sneha Patel',
        passwordHash: hashedPassword,
        role: 'RECEPTIONIST',
      },
    });

    // 4. Create Rooms & Beds
    const r101 = await prisma.room.create({
      data: {
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

    const r202 = await prisma.room.create({
      data: {
        roomNumber: '202',
        floor: 2,
        type: 'DOUBLE',
        status: 'MAINTENANCE',
        defaultPrice: 6000,
        amenitiesJson: JSON.stringify(['WiFi', 'Fan', 'Wardrobe']),
        imagesJson: JSON.stringify([]),
      },
    });
    await prisma.bed.create({ data: { roomId: r202.id, bedNumber: '202-A', isOccupied: false } });
    await prisma.bed.create({ data: { roomId: r202.id, bedNumber: '202-B', isOccupied: false } });

    // 5. Create Customers
    const c1 = await prisma.customer.create({
      data: {
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

    const c3 = await prisma.customer.create({
      data: {
        name: 'Rohan Das',
        fatherName: 'Amit Das',
        motherName: 'Rina Das',
        phone: '7654321098',
        email: 'rohan.das@gmail.com',
        gender: 'Male',
        dob: new Date('1997-12-05'),
        occupation: 'Student',
        companyName: 'PES University',
        emergencyContactName: 'Amit Das (Father)',
        emergencyContactPhone: '7654321097',
        permanentAddress: '66, Salt Lake, Kolkata, West Bengal',
        currentAddress: 'Sector 5, HSR Layout, Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        nationality: 'Indian',
        bloodGroup: 'A-',
      },
    });

    // 6. Create Linked Tenant user for Priya Patel (evaluates tenant dashboard)
    await prisma.user.create({
      data: {
        email: 'tenant@pgnexus.com',
        name: 'Priya Patel',
        passwordHash: hashedPassword,
        role: 'TENANT',
        customerId: c2.id,
      },
    });

    // 7. Create Allocations
    const alloc1 = await prisma.roomAllocation.create({
      data: {
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
        customerId: c2.id,
        roomId: r102.id,
        bedId: b102A.id,
        checkInDate: new Date('2026-06-01'),
        agreementStartDate: new Date('2026-06-01'),
        agreementEndDate: new Date('2026-07-18'), // Expiring very soon (in 2 days)
        status: 'ACTIVE',
        rentOverride: 5800,
      },
    });

    const alloc3 = await prisma.roomAllocation.create({
      data: {
        customerId: c3.id,
        roomId: r102.id,
        bedId: b102B.id,
        checkInDate: new Date('2026-01-01'),
        agreementStartDate: new Date('2026-01-01'),
        agreementEndDate: new Date('2026-06-30'),
        status: 'COMPLETED',
        actualCheckout: new Date('2026-06-30'),
        rentOverride: 6000,
      },
    });

    // 8. Deposits
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

    await prisma.deposit.create({
      data: {
        roomAllocationId: alloc3.id,
        amount: 6000,
        paidAmount: 6000,
        pendingAmount: 0,
        refundAmount: 5000,
        refundDate: new Date('2026-06-30'),
        refundStatus: 'DEDUCTED',
        deductionReason: 'Damage to bathroom latch & key replacement (₹1000)',
      },
    });

    // 9. Payments & Verifications
    await prisma.payment.create({
      data: {
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
    await prisma.payment.create({
      data: {
        customerId: c1.id,
        roomAllocationId: alloc1.id,
        dueDate: new Date('2026-07-05'),
        paidDate: new Date('2026-07-05'),
        amount: 8000,
        status: 'PAID',
        mode: 'UPI',
        transactionId: 'TXN20129481',
      },
    });

    // Priya: June Paid, July Pending Verification
    await prisma.payment.create({
      data: {
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
        customerId: c2.id,
        roomAllocationId: alloc2.id,
        dueDate: new Date('2026-07-05'),
        amount: 5800,
        status: 'PENDING',
        screenshotUrl: '/uploads/receipts/mock-txn.jpg', // Local storage uploads path simulator
        remarks: 'Transferred via UPI. Please verify.',
      },
    });

    await prisma.paymentVerification.create({
      data: {
        paymentId: pendingPayment.id,
        status: 'PENDING',
      },
    });

    // 10. Rent Agreements
    await prisma.rentAgreement.create({
      data: {
        customerId: c1.id,
        roomAllocationId: alloc1.id,
        agreementId: 'AGR-2026-101A',
        ownerName: 'Ramesh Kumar',
        ownerAadhar: '1122 3344 5566',
        ownerPan: 'ABCDE1234F',
        propertyAddress: 'NEXUS PG, Sector 5, HSR Layout, Bengaluru, Karnataka',
        propertyDetails: 'Room 101, Single Sharing Floor 1',
        status: 'SIGNED',
        startPeriod: new Date('2026-05-01'),
        endPeriod: new Date('2027-04-30'),
        lockInMonths: 6,
        noticePeriodDays: 30,
        electricityCharges: '₹10 per unit',
        waterCharges: 'Flat ₹200 per month',
        maintenanceCharges: 'Included in rent',
        rulesText: 'No smoking, guests not allowed after 10 PM.',
      },
    });

    await prisma.rentAgreement.create({
      data: {
        customerId: c2.id,
        roomAllocationId: alloc2.id,
        agreementId: 'AGR-2026-102A',
        ownerName: 'Ramesh Kumar',
        ownerAadhar: '1122 3344 5566',
        ownerPan: 'ABCDE1234F',
        propertyAddress: 'NEXUS PG, Sector 5, HSR Layout, Bengaluru, Karnataka',
        propertyDetails: 'Room 102, Double Sharing Floor 1',
        status: 'SIGNED',
        startPeriod: new Date('2026-06-01'),
        endPeriod: new Date('2026-07-18'),
        lockInMonths: 1,
        noticePeriodDays: 15,
      },
    });

    // 11. Documents
    await prisma.document.create({
      data: {
        customerId: c1.id,
        type: 'AADHAR_FRONT',
        fileUrl: '/uploads/aadhaar/mock-front.jpg',
        verifiedStatus: 'APPROVED',
      },
    });

    await prisma.document.create({
      data: {
        customerId: c2.id,
        type: 'PHOTO',
        fileUrl: '/uploads/photos/mock-priya.jpg',
        verifiedStatus: 'APPROVED',
      },
    });

    // 12. Expenses
    await prisma.expense.create({
      data: {
        category: 'ELECTRICITY',
        amount: 4500,
        date: new Date('2026-07-02'),
        remarks: 'BESCOM main grid bill for July',
        createdById: owner.id,
      },
    });

    await prisma.expense.create({
      data: {
        category: 'SALARY',
        amount: 8000,
        date: new Date('2026-07-01'),
        remarks: 'Receptionist Sneha Patel June salary',
        createdById: owner.id,
      },
    });

    await prisma.expense.create({
      data: {
        category: 'FOOD',
        amount: 15000,
        date: new Date('2026-07-10'),
        remarks: 'Grocery & vegetables supply',
        createdById: manager.id,
      },
    });

    // 13. Complaints
    await prisma.complaint.create({
      data: {
        customerId: c1.id,
        category: 'WATER',
        description: 'Flush valve leaking in room 101 bathroom.',
        status: 'PENDING',
      },
    });

    await prisma.complaint.create({
      data: {
        customerId: c2.id,
        category: 'INTERNET',
        description: 'Wi-Fi has slow speed (under 5 Mbps) since yesterday.',
        status: 'RESOLVED',
        resolvedAt: new Date('2026-07-12'),
      },
    });

    // 14. Visitors
    await prisma.visitor.create({
      data: {
        customerId: c1.id,
        visitorName: 'Sanjay Sharma',
        phone: '9898989898',
        relation: 'Cousin',
        entryTime: new Date('2026-07-14T10:00:00Z'),
        exitTime: new Date('2026-07-14T16:00:00Z'),
      },
    });

    // 15. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: owner.id,
        action: 'PRICE_OVERRIDE_APPROVED',
        details: 'Approved custom price override of ₹5800 for Priya Patel in room 102',
      },
    });

    // 16. Occupancy History (Snapshots)
    await prisma.occupancyHistory.create({
      data: { date: new Date('2026-03-01'), occupiedBeds: 1, totalBeds: 10, occupancyRate: 0.1 },
    });
    await prisma.occupancyHistory.create({
      data: { date: new Date('2026-04-01'), occupiedBeds: 3, totalBeds: 10, occupancyRate: 0.3 },
    });
    await prisma.occupancyHistory.create({
      data: { date: new Date('2026-05-01'), occupiedBeds: 5, totalBeds: 10, occupancyRate: 0.5 },
    });
    await prisma.occupancyHistory.create({
      data: { date: new Date('2026-06-01'), occupiedBeds: 7, totalBeds: 10, occupancyRate: 0.7 },
    });
    await prisma.occupancyHistory.create({
      data: { date: new Date('2026-07-01'), occupiedBeds: 8, totalBeds: 10, occupancyRate: 0.8 },
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

    return NextResponse.json({ success: true, message: 'MySQL database seeded successfully!' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
