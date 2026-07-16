import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import fs from 'fs';
import path from 'path';

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

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'others'; // customers, receipts, agreements, aadhaar, pan, photos, complaints

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save path inside public/uploads/<folder>
    const relativeUploadDir = `/uploads/${folder}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);

    // Auto-create directories if they do not exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean up filename to prevent directory traversal
    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);

    // Write file to local disk storage
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `${relativeUploadDir}/${safeFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: safeFilename,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
