import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, OtpToken } from '@/models';
import { getEmailTransporter, generateOtp } from '@/lib/email';
import { hashPassword } from '@/lib/password';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export async function POST(req) {
  const { purpose, username, email } = await req.json();

  if (!purpose) {
    return NextResponse.json({ error: 'Purpose is required.' }, { status: 400 });
  }

  await connectToDatabase();

  let identifier;
  let recipientEmail;

  if (purpose === 'password_reset') {
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Please enter your username.' }, { status: 400 });
    }
    const user = await User.findOne({ username: username.trim() });
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'No email found for that username. Please contact another admin.' },
        { status: 404 }
      );
    }
    identifier = user.username;
    recipientEmail = user.email;
  } else if (purpose === 'email_verification') {
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    identifier = trimmedEmail;
    recipientEmail = trimmedEmail;
  } else {
    return NextResponse.json({ error: 'Unknown OTP purpose.' }, { status: 400 });
  }

  try {
    const { transporter, from } = await getEmailTransporter();
    const code = generateOtp();
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + FIFTEEN_MIN_MS);

    await OtpToken.create({ purpose, identifier, codeHash, expiresAt, used: false });

    const subject =
      purpose === 'password_reset'
        ? 'Medryon Password Reset Code'
        : 'Medryon Email Verification Code';
    const text =
      purpose === 'password_reset'
        ? `Your Medryon password reset code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`
        : `Your Medryon email verification code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`;

    await transporter.sendMail({
      to: recipientEmail,
      from: `${from} <${from}>`,
      subject,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('OTP send failed', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send OTP. Check SMTP settings and try again.' },
      { status: 500 }
    );
  }
}
