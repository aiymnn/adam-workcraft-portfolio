'use client';

import Image from 'next/image';
import { useAdminTheme } from '@/context/admin-theme-context';
import { MenuIcon, SunIcon, MoonIcon, SidebarCollapseIcon, SidebarExpandIcon } from '@/components/shared/icons';
import { BRAND_ICON_PATH, BRAND_NAME } from '@/lib/branding';

interface AdminHeaderProps {
  sidebarExpanded: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
}

export default function AdminHeader({
  sidebarExpanded,
  isMobile,
  onToggleSidebar,
}: AdminHeaderProps) {
  const { theme, toggleTheme, mounted } = useAdminTheme();
  const toggleLabel = isMobile
    ? 'Toggle menu'
    : sidebarExpanded
      ? 'Collapse sidebar'
      : 'Expand sidebar';

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-start)]/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <Image
          src={BRAND_ICON_PATH}
          alt={BRAND_NAME}
          width={26}
          height={26}
          priority
          className="size-6 rounded-sm object-contain md:size-[26px]"
        />
        <h1 className="text-sm font-semibold tracking-tight md:text-base">Admin Panel</h1>
        <button
          onClick={onToggleSidebar}
          className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {isMobile ? <MenuIcon /> : sidebarExpanded ? <SidebarCollapseIcon /> : <SidebarExpandIcon />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        )}
      </div>
    </header>
  );
}
