import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, OtpToken } from '@/models';
import { hashPassword, verifyPassword } from '@/lib/password';

export async function POST(req) {
  const { username, code, newPassword } = await req.json();

  if (!username || !code || !newPassword) {
    return NextResponse.json({ error: 'Missing username, code, or new password.' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  await connectToDatabase();

  const candidates = await OtpToken.find({
    purpose: 'password_reset',
    identifier: username.trim(),
    used: false,
    expiresAt: { $gt: new Date() },
  });

  let matched = null;
  for (const entry of candidates) {
    if (await verifyPassword(String(code).trim(), entry.codeHash)) {
      matched = entry;
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Invalid or expired OTP code.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await User.updateOne({ username: username.trim() }, { passwordHash });
  matched.used = true;
  await matched.save();

  return NextResponse.json({ success: true });
}
