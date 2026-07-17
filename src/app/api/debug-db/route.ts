import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL is not set in environment variables.' });
    }

    // Parse URL safely
    const parsed = new URL(dbUrl);
    return NextResponse.json({
      success: true,
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      username: parsed.username ? `${parsed.username.substring(0, 3)}...` : 'None',
      passwordLength: parsed.password ? parsed.password.length : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
