'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminTheme } from '@/context/admin-theme-context';
import { CheckIcon, XIcon, ChevronLeftIcon } from '@/components/shared/icons';

const WEAK_PASSWORDS = new Set(['password', 'password123', '12345678', 'qwerty', 'letmein', 'admin123']);

function getChecks(password: string) {
  return [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Has lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Has uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Has number', passed: /[0-9]/.test(password) },
    { label: 'Has symbol', passed: /[^A-Za-z0-9]/.test(password) },
    { label: 'No spaces', passed: !/\s/.test(password) },
    { label: 'Not a common password', passed: !WEAK_PASSWORDS.has(password.toLowerCase()) },
  ];
}

function ResetPasswordForm() {
  useAdminTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const checks = getChecks(newPassword);
  const allPassed = checks.every((c) => c.passed);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) { setStatus('error'); setMessage('Invalid reset link.'); return; }
      if (!allPassed) { setStatus('error'); setMessage('Password does not meet all requirements.'); return; }
      if (newPassword !== confirmPassword) { setStatus('error'); setMessage('Passwords do not match.'); return; }

      setStatus('loading');
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: newPassword }),
        });
        const data = (await res.json()) as { success?: boolean; message?: string };
        if (res.ok && data.success) {
          setStatus('success');
          setTimeout(() => router.push('/admin/login?reset=1'), 2000);
        } else {
          setStatus('error');
          setMessage(data.message ?? 'Reset failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    },
    [token, newPassword, confirmPassword, allPassed, router],
  );

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-red-400">Invalid or missing reset link.</p>
          <Link href="/admin/forgot-password" className="mt-3 block text-sm text-[var(--text-dim)] hover:text-[var(--text)]">
            Request a new one
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set New Password</CardTitle>
        <CardDescription>Choose a strong password for your admin account.</CardDescription>
      </CardHeader>

      <CardContent>
        {status === 'success' ? (
          <div className="space-y-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
              <svg className="size-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-emerald-300 font-medium">Password reset! Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-muted)]">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => { setMessage(''); setNewPassword(e.target.value); }}
                placeholder="Min. 8 chars, upper/lower/number/symbol"
                disabled={status === 'loading'}
              />
              {newPassword && (
                <div className="space-y-1 rounded-lg border border-[var(--border)]/60 bg-[var(--button)]/30 p-3">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      {c.passed ? (
                        <CheckIcon className="size-3.5 text-emerald-400" />
                      ) : (
                        <XIcon className="size-3.5 text-red-400" />
                      )}
                      <span className={c.passed ? 'text-emerald-300' : 'text-red-300'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-muted)]">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setMessage(''); setConfirmPassword(e.target.value); }}
                placeholder="Re-enter new password"
                disabled={status === 'loading'}
              />
            </div>

            {message && (
              <p className="text-sm text-red-400">{message}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={status === 'loading' || !allPassed || !confirmPassword}
            >
              {status === 'loading' ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <Suspense fallback={<div className="text-center text-sm text-[var(--text-dim)]">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
          >
            <ChevronLeftIcon className="size-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
