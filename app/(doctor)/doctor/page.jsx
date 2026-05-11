import { auth } from '@/app/api/auth/[...nextauth]/route';

export default async function DoctorDashboard() {
  const session = await auth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Welcome, {session?.user?.name} (role: {session?.user?.role})
      </p>
      <p className="mt-4 text-sm">Patient management UI coming in Phase 1b.</p>
    </div>
  );
}
