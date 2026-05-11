'use client';

import { useState } from 'react';

export default function FirstRunForm() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/first-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed');
      } else {
        window.location.href = '/login';
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Welcome to Medryon</h1>
      <p className="text-sm text-gray-600">Create your admin account to begin.</p>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" type="text" required value={form.name} onChange={update('name')}
          className="mt-1 block w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium">Username</label>
        <input id="username" type="text" required value={form.username} onChange={update('username')}
          className="mt-1 block w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" type="email" required value={form.email} onChange={update('email')}
          className="mt-1 block w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
        <input id="phone" type="tel" required value={form.phone} onChange={update('phone')}
          className="mt-1 block w-full rounded border p-2" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input id="password" type="password" required minLength={6} value={form.password}
          onChange={update('password')} className="mt-1 block w-full rounded border p-2" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? 'Creating...' : 'Create admin'}
      </button>
    </form>
  );
}
