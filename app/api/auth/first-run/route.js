import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models';
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
