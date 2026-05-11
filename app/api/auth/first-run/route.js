import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, OtpToken } from '@/models';
import { hashPassword } from '@/lib/password';

export async function POST(req) {
  const body = await req.json();
  const { name, username, email, phone, password } = body || {};

  if (!name || !username || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  await connectToDatabase();
  const existingAdmin = await User.countDocuments({ role: 'admin' });
  if (existingAdmin > 0) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 403 });
  }

  // Require the email to have been verified via OTP within the past 24 hours.
  // Test/dev shortcut: skip if SKIP_EMAIL_VERIFY=1 in env.
  if (process.env.SKIP_EMAIL_VERIFY !== '1') {
    const emailKey = email.trim().toLowerCase();
    const verifiedToken = await OtpToken.findOne({
      purpose: 'email_verification',
      identifier: emailKey,
      used: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (!verifiedToken) {
      return NextResponse.json(
        { error: 'Email not verified. Please send and verify the OTP first.' },
        { status: 400 }
      );
    }
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    role: 'admin',
    name: name.trim(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    passwordHash,
    emailVerified: true,
  });

  return NextResponse.json({ success: true });
}
