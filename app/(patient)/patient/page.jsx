import { auth } from '@/app/api/auth/[...nextauth]/route';

export default async function PatientDashboard() {
  const session = await auth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Patient Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Welcome, {session?.user?.name}</p>
      <p className="mt-4 text-sm">Your portal will appear here in Phase 3.</p>
    </div>
  );
}
