'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/context/admin-theme-context';
import { SunIcon, MoonIcon, ChevronLeftIcon } from '@/components/shared/icons';
import { checkSession, login, getLastPage } from '@/lib/services/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const router = useRouter();
  const { theme, toggleTheme } = useAdminTheme();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const authenticated = await checkSession();
      if (active && authenticated) {
        router.replace(getLastPage() || '/admin/dashboard');
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setError('');
      setIsSubmitting(true);

      const normalizedUsername = username.trim();
      const normalizedPassword = password;

      if (!normalizedUsername || !normalizedPassword) {
        setError('Username and password are required');
        toast.error('Missing credentials');
        setIsSubmitting(false);
        return;
      }

      if (await login(normalizedUsername, normalizedPassword)) {
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {mounted && (
        <button
          onClick={toggleTheme}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      )}

      <div className={`w-full max-w-sm ${shaking ? 'animate-shake' : 'animate-fade-in'}`}>
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

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => toast.info('Contact admin@adamworkcraft.com to reset your password')}
                  className="text-xs text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                >
                  Forgot account?
                </button>
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
    </div>
  );
}
