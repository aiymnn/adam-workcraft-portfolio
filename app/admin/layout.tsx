'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminThemeProvider } from '@/context/admin-theme-context';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { BRAND_ADMIN_NAME } from '@/lib/branding';
import type { ReactNode } from 'react';

const ADMIN_TAB_TITLE_BY_PATH: Array<{ test: RegExp; title: string }> = [
  { test: /^\/admin\/dashboard$/, title: 'Dashboard' },
  { test: /^\/admin\/basic-info$/, title: 'Basic Info' },
  { test: /^\/admin\/profile$/, title: 'Profile' },
  { test: /^\/admin\/schedule$/, title: 'Schedule' },
  { test: /^\/admin\/statistics$/, title: 'Statistics' },
  { test: /^\/admin\/gallery\/vault$/, title: 'Vault Gallery' },
  { test: /^\/admin\/gallery\/reviews$/, title: 'Review Gallery' },
  { test: /^\/admin\/gallery\/story-loop-images$/, title: 'Story Loop Images' },
  { test: /^\/admin\/gallery\/story-loop-logos$/, title: 'Story Loop Images' },
  { test: /^\/admin\/social$/, title: 'Social Links' },
  { test: /^\/admin\/social\/.+$/, title: 'Social Platform' },
  { test: /^\/admin\/login$/, title: 'Login' },
];

function resolveAdminTabTitle(pathname: string): string {
  const match = ADMIN_TAB_TITLE_BY_PATH.find((item) => item.test.test(pathname));
  return match?.title ?? 'Admin';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const sectionTitle = resolveAdminTabTitle(pathname || '/admin');
    document.title = `${sectionTitle} | ${BRAND_ADMIN_NAME}`;
  }, [pathname]);

  return (
    <AdminThemeProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </AdminThemeProvider>
  );
}
