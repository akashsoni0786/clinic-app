'use client';

import { useState } from 'react';

const SKIP_EMAIL_VERIFY = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFY === '1';

export default function FirstRunForm() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(SKIP_EMAIL_VERIFY);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^\+?[0-9]{7,15}$/.test(value);

  const handleSendVerificationOtp = async () => {
    if (!email.trim()) {
      setVerificationMessage('Please enter an email address first.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setVerificationMessage('Please enter a valid email address.');
      return;
    }
    setVerificationMessage('');
    setSendingOtp(true);
    try {
      const r = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'email_verification', email: email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setVerificationMessage(data.error || 'Unable to send verification code.');
      } else {
        setVerificationMessage('Verification code sent. Check your inbox.');
      }
    } catch {
      setVerificationMessage('Unable to send verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!verificationCode.trim()) {
      setVerificationMessage('Please enter the verification code.');
      return;
    }
    setVerificationMessage('');
    setVerifyingOtp(true);
    try {
      const r = await fetch('/api/auth/otp/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setVerificationMessage(data.error || 'Unable to verify code.');
      } else {
        setEmailVerified(true);
        setVerificationMessage('Email verified successfully.');
      }
    } catch {
      setVerificationMessage('Unable to verify code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !contact.trim() || !password || !confirm) {
      setError('All fields are required.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidPhone(contact.trim())) {
      setError('Please enter a valid contact number (digits only, 7-15 characters).');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email address before creating the account.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/first-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          phone: contact.trim(),
          password,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || 'Setup failed.');
      } else {
        window.location.href = '/login';
      }
    } catch {
      setError('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex min-h-[calc(100vh-110px)] flex-col items-center justify-center gap-8 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/logo.png" alt="Medryon" className="login-brand-logo" />
          <span className="login-brand-name">Medryon</span>
          <p className="welcome-heading">First time setup — create your admin account</p>
        </div>
        <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailVerified(false);
                  setVerificationCode('');
                  setVerificationMessage('');
                }}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Contact Number</label>
              <input
                type="tel"
                autoComplete="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. +911234567890"
                className="input-base"
              />
            </div>
            {SKIP_EMAIL_VERIFY ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Dev mode — email OTP verification skipped. Remove
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-xs">SKIP_EMAIL_VERIFY</code>
                from <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-xs">.env.local</code>
                once SMTP is configured.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={handleSendVerificationOtp}
                      disabled={sendingOtp || emailVerified}
                    >
                      {sendingOtp ? 'Sending code...' : emailVerified ? 'Email verified' : 'Send verification code'}
                    </button>
                  </div>
                  {emailVerified && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Email verified successfully.
                    </div>
                  )}
                </div>
                {verificationMessage && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {verificationMessage}
                  </div>
                )}
                {!emailVerified && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Verification Code</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="input-base flex-1"
                      />
                      <button
                        type="button"
                        className="rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleVerifyEmailOtp}
                        disabled={verifyingOtp}
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-base pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((c) => !c)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
