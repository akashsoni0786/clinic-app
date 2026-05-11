import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User } from '@/models';

export async function GET() {
  await connectToDatabase();
  const adminCount = await User.countDocuments({ role: 'admin' });
  return NextResponse.json({ isFirstRun: adminCount === 0 });
}
