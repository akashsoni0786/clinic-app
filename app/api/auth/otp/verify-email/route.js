import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { OtpToken } from '@/models';
import { verifyPassword } from '@/lib/password';

export async function POST(req) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedCode = String(code).trim();

  await connectToDatabase();

  const candidates = await OtpToken.find({
    purpose: 'email_verification',
    identifier: trimmedEmail,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  let matched = null;
  for (const entry of candidates) {
    if (await verifyPassword(trimmedCode, entry.codeHash)) {
      matched = entry;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
  }

  matched.used = true;
  await matched.save();

  return NextResponse.json({ success: true });
}
