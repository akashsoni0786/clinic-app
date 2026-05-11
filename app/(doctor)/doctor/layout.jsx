import { auth } from '@/app/api/auth/[...nextauth]/route';
import Panel from '@/components/doctor/Panel';

export default async function DoctorLayout({ children }) {
  const session = await auth();
  // first-run page is public-ish — when no session, render bare children (no Panel chrome)
  if (!session?.user) {
    return <>{children}</>;
  }
  return <Panel user={session.user}>{children}</Panel>;
}
