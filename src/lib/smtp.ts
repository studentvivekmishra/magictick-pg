import { prisma } from './prisma';

interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailParams) {
  try {
    // 1. Fetch system SMTP configurations dynamically from SQL settings
    const settings = await prisma.systemSettings.findFirst();

    if (!settings || !settings.smtpUser || !settings.smtpPass) {
      // Graceful fallback for local evaluation and testing without SMTP credentials configured
      console.log('--- Configurable SMTP Mailer Triggered (MOCK mode) ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('----------------------------------------------------');
      return { success: true, mock: true };
    }

    // Dynamic import of nodemailer to ensure app compiles and runs even if dev dependencies aren't loaded
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465, // True for 465, false for 587
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${settings.pgName}" <${settings.smtpUser}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log('SMTP Email dispatched successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('SMTP Delivery failed:', error);
    return { success: false, error: error.message };
  }
}
