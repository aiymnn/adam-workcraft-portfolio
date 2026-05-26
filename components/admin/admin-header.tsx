'use client';

import { Button } from '@/components/ui/button';
import { useAdminTheme } from '@/context/admin-theme-context';
import { logout } from '@/lib/services/auth';
import { MenuIcon, SunIcon, MoonIcon, ChevronLeftIcon, ChevronRightIcon, LogoutIcon } from '@/components/shared/icons';

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
