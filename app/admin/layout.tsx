'use client';

import { AdminThemeProvider } from '@/context/admin-theme-context';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminThemeProvider>
      {children}
    </AdminThemeProvider>
  );
}
