'use client';

import type { ReactNode } from 'react';
import FluidBg from '@/components/ui/fluid-bg';
import { LanguageProvider } from '@/context/language-context';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <FluidBg />
      {children}
    </LanguageProvider>
  );
}
