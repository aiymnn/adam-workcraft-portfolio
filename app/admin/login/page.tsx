'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAdminTheme } from '@/context/admin-theme-context';
import { SunIcon, MoonIcon, ChevronLeftIcon } from '@/components/shared/icons';
import { login, isAuthenticated, getLastPage } from '@/lib/services/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const router = useRouter();
  const { theme, toggleTheme } = useAdminTheme();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated()) {
      router.replace(getLastPage() || '/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (login(username, password)) {
        toast.success('Welcome back');
        router.push(getLastPage() || '/admin/dashboard');
        return;
      }

      setError('Invalid username or password');
      toast.error('Invalid credentials');
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
    },
    [username, password, router, toast],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>

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
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button type="submit" variant="primary" className="w-full">
                Sign In
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
