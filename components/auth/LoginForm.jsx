'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { dashboardForRole } from '@/lib/permissions';

export default function LoginForm() {
  const [role, setRole] = useState('doctor');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [firstRunChecked, setFirstRunChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/first-run-status')
      .then((r) => r.json())
      .then((d) => {
        if (d.isFirstRun) {
          window.location.href = '/doctor/first-run';
        } else {
          setFirstRunChecked(true);
        }
      })
      .catch(() => setFirstRunChecked(true));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credentials =
        role === 'doctor'
          ? { username: form.username, password: form.password, redirect: false }
          : { email: form.email, password: form.password, redirect: false };
      const res = await signIn(role, credentials);
      if (!res || !res.ok) {
        setError('Invalid credentials');
      } else {
        const target = role === 'doctor' ? dashboardForRole('staff') : dashboardForRole('patient');
        window.location.href = target;
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!firstRunChecked) {
    return <div className="p-8 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in to Medryon</h1>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`flex-1 rounded border p-2 ${role === 'doctor' ? 'bg-slate-900 text-white' : ''}`}
        >
          Doctor
        </button>
        <button
          type="button"
          onClick={() => setRole('patient')}
          className={`flex-1 rounded border p-2 ${role === 'patient' ? 'bg-slate-900 text-white' : ''}`}
        >
          Patient
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {role === 'doctor' ? (
          <div>
            <label htmlFor="username" className="block text-sm font-medium">Username</label>
            <input id="username" type="text" required value={form.username} onChange={update('username')}
              className="mt-1 block w-full rounded border p-2" />
          </div>
        ) : (
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update('email')}
              className="mt-1 block w-full rounded border p-2" />
          </div>
        )}
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input id="password" type="password" required value={form.password} onChange={update('password')}
            className="mt-1 block w-full rounded border p-2" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
