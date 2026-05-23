'use client';

import { useRouter, usePathname } from 'next/navigation';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { id: 'basic-info', label: 'Basic Info', href: '/admin/basic-info' },
  { id: 'scheduling', label: 'Scheduling', href: '/admin/schedule' },
];

function GridIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

const iconMap: Record<string, typeof PersonIcon> = {
  dashboard: GridIcon,
  'basic-info': PersonIcon,
  scheduling: CalendarIcon,
};

function isActive(href: string, pathname: string): boolean {
  return pathname === href;
}

interface DesktopSidebarProps {
  expanded: boolean;
}

export function DesktopSidebar({ expanded }: DesktopSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-mid)]/60 transition-[width] duration-300 ease-in-out ${expanded ? 'w-56' : 'w-14'}`}
      style={{ willChange: 'width' }}
    >
      <nav className="space-y-1 p-3">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = iconMap[item.id];
          const active = isActive(item.href, pathname);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
              } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
              title={!expanded ? item.label : undefined}
            >
              <Icon />
              <span className={`truncate ${expanded ? '' : 'hidden'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-56 flex-col bg-[var(--bg-mid)] shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="text-sm font-semibold">Navigation</span>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = iconMap[item.id];
            const active = isActive(item.href, pathname);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--button-hover)] text-[var(--text)]'
                    : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                }`}
              >
                <Icon />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
