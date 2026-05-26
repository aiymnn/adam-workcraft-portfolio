'use client';

import { AdminThemeProvider } from '@/context/admin-theme-context';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminThemeProvider>
      <ToastProvider>
        {children}
        <Toaster />
      </ToastProvider>
    </AdminThemeProvider>
  );
}
