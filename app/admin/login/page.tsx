'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/context/admin-theme-context';
import { SunIcon, MoonIcon, ChevronLeftIcon } from '@/components/shared/icons';
import { checkSession, login, getLastPage } from '@/lib/services/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useAdminTheme();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const hasToasted = useRef(false);

  useEffect(() => {
    setMounted(true);

    if (hasToasted.current) return;

    // Show toast from URL params
    const verifiedParam = searchParams.get('verified');
    const resetParam = searchParams.get('reset');
    const errorParam = searchParams.get('error');

    let didToast = false;
    if (verifiedParam === '1') {
      toast.success('Email verified! You can now sign in.');
      didToast = true;
    } else if (resetParam === '1') {
      toast.success('Password reset successfully. Please sign in.');
      didToast = true;
    } else if (errorParam) {
      toast.error('Verification link is invalid or has expired.');
      didToast = true;
    }
    
    if (didToast) {
      hasToasted.current = true;
      // Optionally clean up URL so refresh doesn't toast again
      window.history.replaceState({}, '', '/admin/login');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      const authenticated = await checkSession();
      if (active && authenticated) {
        router.replace(getLastPage() || '/admin/dashboard');
      }
    })();
    return () => { active = false; };
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError('');
      setVerificationSent(false);
      setIsSubmitting(true);

      const normalizedUsername = username.trim();
      const normalizedPassword = password;

      if (!normalizedUsername || !normalizedPassword) {
        setError('Username and password are required');
        toast.error('Missing credentials');
        setIsSubmitting(false);
        return;
      }

      const result = await login(normalizedUsername, normalizedPassword);

      if (result.success) {
        toast.success('Welcome back');
        router.push(getLastPage() || '/admin/dashboard');
        setIsSubmitting(false);
        return;
      }

      setError('Invalid username or password');
      toast.error('Invalid credentials');
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
      setIsSubmitting(false);
    },
    [isSubmitting, username, password, router, toast],
  );

  return (
    <div className={`w-full max-w-sm ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
      {mounted && (
        <button
          onClick={toggleTheme}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      )}

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Admin Sign In</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-muted)]">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-muted)]">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Link
                href="/admin/forgot-password"
                className="text-xs text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <button
          onClick={() => window.open('/', '_blank')}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
        >
          <ChevronLeftIcon className="size-3.5" />
          Back to site
        </button>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
