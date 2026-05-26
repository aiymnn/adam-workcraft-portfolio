'use client';

import { useRouter, usePathname } from 'next/navigation';
import { GridIcon, PersonIcon, CalendarIcon, XIcon } from '@/components/shared/icons';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { id: 'basic-info', label: 'Basic Info', href: '/admin/basic-info' },
  { id: 'scheduling', label: 'Scheduling', href: '/admin/schedule' },
];



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
            <XIcon />
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
