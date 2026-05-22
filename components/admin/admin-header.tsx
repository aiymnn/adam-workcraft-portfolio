'use client';

import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/app/admin/layout';

function MenuIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

interface AdminHeaderProps {
  sidebarExpanded: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
  onSignOut: () => void;
}

export default function AdminHeader({
  sidebarExpanded,
  isMobile,
  onToggleSidebar,
  onSignOut,
}: AdminHeaderProps) {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-start)]/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          aria-label={isMobile ? 'Toggle menu' : 'Toggle sidebar'}
        >
          {isMobile ? <MenuIcon /> : sidebarExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </button>
        <h1 className="text-sm font-semibold tracking-tight md:text-base">Admin Panel</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onSignOut}
          className="hidden border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] md:inline-flex"
        >
          Sign Out
        </Button>
        <button
          onClick={onSignOut}
          className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] md:hidden"
          aria-label="Sign Out"
        >
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
}
