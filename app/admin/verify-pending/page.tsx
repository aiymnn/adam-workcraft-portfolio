'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useAdminTheme } from '@/context/admin-theme-context';
import { ChevronLeftIcon } from '@/components/shared/icons';

export default function VerifyPendingPage() {
  useAdminTheme();
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const handleResend = useCallback(async () => {
    setResendStatus('loading');
    try {
      // The login endpoint re-sends the verification email when called for an unverified account.
      // Instead, we just ask the user to try logging in again which triggers re-send.
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in text-center space-y-6">
        {/* Icon */}
        <div className="flex size-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 mx-auto">
          <svg className="size-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Verify Your Email</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
            A verification link has been sent to your admin email address. Click the link in the email to activate your account.
          </p>
          <p className="mt-3 text-xs text-[var(--text-dim)]">
            Check your spam/junk folder if you don&apos;t see it within a few minutes.
          </p>
        </div>

        {resendStatus === 'sent' ? (
          <p className="text-sm text-emerald-400">
            Please log in again to receive a new verification email.
          </p>
        ) : resendStatus === 'error' ? (
          <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendStatus === 'loading'}
            className="text-sm text-[var(--text-dim)] underline-offset-2 hover:underline hover:text-[var(--text)] transition-colors disabled:opacity-50"
          >
            {resendStatus === 'loading' ? 'Please wait…' : 'Resend verification email'}
          </button>
        )}

        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
        >
          <ChevronLeftIcon className="size-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
