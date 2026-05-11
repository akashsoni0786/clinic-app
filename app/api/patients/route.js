import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import { Patient } from '@/models';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectToDatabase();
  const patients = await Patient.find({}).lean();
  return NextResponse.json(
    patients.map((p) => ({ ...p, _id: String(p._id), id: p.legacyId || String(p._id) }))
  );
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'staff')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectToDatabase();
  const body = await req.json();
  const doc = await Patient.create({
    ...body,
    createdBy: session.user.id,
    legacyId: body.id, // preserve the Electron-style timestamp ID
  });
  return NextResponse.json({ ...doc.toObject(), _id: String(doc._id), id: doc.legacyId || String(doc._id) });
}
