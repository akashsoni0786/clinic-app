'use client';

import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

const BASE_TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/doctor' },
  { id: 'history', label: 'All Patients', path: '/doctor/history' },
  { id: 'add-new-patient', label: 'Add New Patient', path: '/doctor/patientform' },
];

const ADMIN_TABS = [
  { id: 'admin', label: 'Users', path: '/doctor/admin' },
  { id: 'settings', label: 'Settings', path: '/doctor/settings' },
];

export default function Panel({ user, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';
  const tabs = isAdmin ? [...BASE_TABS, ...ADMIN_TABS] : BASE_TABS;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login', redirect: true });
  };

  const isActive = (path) => {
    if (path === '/doctor') return pathname === '/doctor';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <div>
      <div
        className="watermark"
        style={{ backgroundImage: 'url(/logo.png)' }}
      />
      <div className="app-header">
        <div className="brand">
          <img src="/logo.png" alt="Medryon" className="brand-logo" />
          <span className="brand-name">Medryon</span>
        </div>
        <div className="header-user">
          <span>
            <strong>{user?.name}</strong> &nbsp;·&nbsp; {user?.role}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="mx-auto flex flex-wrap gap-2 px-4 py-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => router.push(tab.path)}
            className={`rounded-full h-10 px-4 py-2 text-sm font-semibold ${
              isActive(tab.path)
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="container py-4">{children}</div>
    </div>
  );
}
