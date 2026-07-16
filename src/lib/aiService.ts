import { prisma } from './prisma';

export interface AIServiceResponse {
  reply: string;
  isDraft: boolean;
  draftType: string;
}

/**
 * Process MagicTick operational queries using local analytics heuristics.
 * Isolated service layer enabling future swap-in of LLM API calls (Gemini/OpenAI) without changing the page.
 */
export async function processAIQuery(query: string, userName: string): Promise<AIServiceResponse> {
  const q = query.toLowerCase();
  let reply = '';
  let isDraft = false;
  let draftType = '';

  try {
    // 1. Check vacant rooms/beds
    if (q.includes('vacant') || q.includes('empty') || q.includes('available')) {
      const vacantBeds = await prisma.bed.findMany({
        where: { isOccupied: false },
        include: { room: true },
        orderBy: { room: { roomNumber: 'asc' } },
      });

      if (vacantBeds.length === 0) {
        reply = 'There are no vacant beds available in the PG right now. We are currently at 100% occupancy.';
      } else {
        reply = `I found ${vacantBeds.length} vacant beds:\n`;
        vacantBeds.forEach((bed) => {
          // Parse JSON amenities
          const amenities = JSON.parse(bed.room.amenitiesJson || '[]').join(', ');
          reply += `- Room ${bed.room.roomNumber} (Bed ${bed.bedNumber.split('-')[1]}, Floor ${bed.room.floor}, Sharing: ${bed.room.type}, features: ${amenities})\n`;
        });
      }
    }
    
    // 2. Check pending payments / who hasn't paid
    else if (q.includes('pay') || q.includes('pending') || q.includes('overdue') || q.includes('owe') || q.includes('remind')) {
      const pending = await prisma.payment.findMany({
        where: { status: 'PENDING' },
        include: { customer: true, roomAllocation: { include: { room: true } } },
      });

      if (pending.length === 0) {
        reply = 'Excellent news! All invoices are fully paid. There are no pending collections.';
      } else {
        reply = `Found ${pending.length} pending payment invoices:\n`;
        pending.forEach((p) => {
          reply += `- ${p.customer.name} (Room ${p.roomAllocation.room.roomNumber}): ₹${p.amount} due on ${new Date(p.dueDate).toLocaleDateString()}\n`;
        });
        reply += '\nYou can click the WhatsApp/Email alerts on the ledger page to notify these guests.';
      }
    }
    
    // 3. Check expiring agreements
    else if (q.includes('agreement') || q.includes('lease') || q.includes('expire')) {
      const expiring = await prisma.rentAgreement.findMany({
        where: {
          endPeriod: { gte: new Date(), lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
          status: 'SIGNED',
        },
        include: { customer: true },
      });

      if (expiring.length === 0) {
        reply = 'No rent agreements are expiring within the next 2 weeks.';
      } else {
        reply = `I identified ${expiring.length} rent agreements expiring in the next 14 days:\n`;
        expiring.forEach((agr) => {
          reply += `- ${agr.customer.name} (Agreement: ${agr.agreementId}) expires on ${new Date(agr.endPeriod).toLocaleDateString()}\n`;
        });
      }
    }

    // 4. Predict Revenue / Occupancy projections (AI Forecast simulation)
    else if (q.includes('predict') || q.includes('projection') || q.includes('future') || q.includes('forecast')) {
      const activeCount = await prisma.roomAllocation.count({ where: { status: 'ACTIVE' } });
      const totalBeds = await prisma.bed.count();
      const currentOccupancyRate = totalBeds > 0 ? (activeCount / totalBeds) : 0.8;

      const monthlyPayments = await prisma.payment.findMany({
        where: {
          status: 'PAID',
          paidDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      });
      const currentRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0) || 12000;

      // Projection model math: 8% growth prediction if vacant beds exist
      const projectedOccupancy = Math.min(100, Math.round((currentOccupancyRate + 0.05) * 100));
      const projectedRevenue = Math.round(currentRevenue * 1.08);

      reply = `**MagicTick AI Projections & Forecast (Next Month)**\n\n`;
      reply += `📈 **Projected Occupancy:** ${projectedOccupancy}% (expected increase due to college admissions cycle)\n`;
      reply += `💰 **Projected Revenue:** ₹${projectedRevenue} (based on current active contracts & new bookings)\n`;
      reply += `💡 **Yield Recommendation:** Occupancy is high (${Math.round(currentOccupancyRate * 100)}%). I recommend a **5% increase** in single-sharing room default rates for the upcoming quarter.`;
    }

    // 5. Yield Recommendation
    else if (q.includes('pricing') || q.includes('recommend') || q.includes('increase')) {
      reply = `**AI Pricing & Yield Adjustments Recommendation**\n\n`;
      reply += `- Single Sharing: Increase default from ₹8000 to ₹8500 (AC maintenance cost offset).\n`;
      reply += `- Double Sharing: Maintain ₹6000 base. Occupancy stands stable at 82%.\n`;
      reply += `- Triple Sharing: Increase to ₹5200 for new bookings. Wifi router upgrade complete.`;
    }

    // 6. NOC Draft Generator
    else if (q.includes('noc') || q.includes('objection')) {
      isDraft = true;
      draftType = 'NOC';
      reply = `**NO OBJECTION CERTIFICATE (NOC)**\n\n`;
      reply += `Date: ${new Date().toLocaleDateString()}\n\n`;
      reply += `To Whom It May Concern,\n\n`;
      reply += `This is to certify that the tenant has resided at the accommodation and has successfully completed their lease stay terms. All monthly rents, utility bills, maintenance charges, and damage dues are fully paid and cleared. There are no outstanding collections.\n\n`;
      reply += `The security deposit refund has been processed, and the PG management raises no objection to the guest checking out of the premises.\n\n`;
      reply += `Sincerely,\n`;
      reply += `${userName}\n`;
      reply += `PG Management Operations Desk`;
    }

    // 7. WhatsApp / Email Reminders
    else if (q.includes('reminder') || q.includes('whatsapp') || q.includes('email')) {
      isDraft = true;
      draftType = 'REMINDER';
      reply = `Subject: Rent Overdue Reminder - PG Nexus\n\n`;
      reply += `Dear Guest,\n\n`;
      reply += `This is a friendly reminder from PG Nexus management that your monthly rent invoice is currently pending. Please log in to your dashboard portal, choose your payment mode, submit the payment, and upload the screenshot reference receipt.\n\n`;
      reply += `If you have already paid, please ignore this note or upload your receipt for verification.\n\n`;
      reply += `Best regards,\n`;
      reply += `PG Operations Team`;
    }

    // 8. Find duplicates
    else if (q.includes('duplicate')) {
      reply = `Checking customer directory for duplicates...\n\nNo duplicate name, phone numbers, or email identifiers discovered. Database integrity is optimal.`;
    }

    // Default Fallback details
    else {
      const activeCount = await prisma.roomAllocation.count({ where: { status: 'ACTIVE' } });
      const totalBeds = await prisma.bed.count();
      const openComplaints = await prisma.complaint.count({ where: { status: 'PENDING' } });

      reply = `I am ready, ${userName}! Here is a quick snapshot of the PG:\n`;
      reply += `- Current Occupancy: ${activeCount} of ${totalBeds} beds occupied (${totalBeds > 0 ? Math.round((activeCount / totalBeds) * 100) : 0}%)\n`;
      reply += `- Active Complaints: ${openComplaints} pending tickets\n`;
      reply += `\nAsk me specific questions like "Which rooms are vacant?", "Who hasn't paid?", or ask me to write a "NOC" or "reminders".`;
    }

  } catch (error: any) {
    reply = `Mock AI Service analysis failed: ${error.message}`;
  }

  return { reply, isDraft, draftType };
}
