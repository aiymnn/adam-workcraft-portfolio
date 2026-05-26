'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { GridIcon, PersonIcon, CalendarIcon, ShareIcon, ChevronDownIcon, XIcon } from '@/components/shared/icons';
import { SOCIAL_PLATFORMS, type SocialPlatformId, loadProfile } from '@/lib/constants';

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon?: typeof GridIcon;
  children?: { id: string; label: string; href: string }[];
};

const MAIN_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: GridIcon },
  { id: 'scheduling', label: 'Scheduling', href: '/admin/schedule', icon: CalendarIcon },
  {
    id: 'social',
    label: 'Social Media',
    icon: ShareIcon,
    children: [
      { id: 'all', label: 'All Links', href: '/admin/social' },
      ...SOCIAL_PLATFORMS.map((p) => ({
        id: p.id as SocialPlatformId,
        label: p.label,
        href: `/admin/social/${p.id}` as const,
      })),
    ],
  },
];

const PROFILE_ITEM: SidebarItem = { id: 'profile', label: 'Profile', href: '/admin/profile', icon: PersonIcon };

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin/social') return pathname === '/admin/social';
  return pathname === href || pathname.startsWith(href + '/');
}

interface DesktopSidebarProps {
  expanded: boolean;
}

export function DesktopSidebar({ expanded }: DesktopSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [socialOpen, setSocialOpen] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '' });
  useEffect(() => { setProfile(loadProfile()); }, []);

  return (
    <aside
      className="shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-mid)]/60 transition-[width] duration-300 ease-in-out flex flex-col"
      style={{ willChange: 'width', width: expanded ? '14rem' : '3.5rem' }}
    >
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {MAIN_ITEMS.map((item) => {
          if (item.children) {
            const parentActive = isActive('/admin/social', pathname);
            return (
              <div key={item.id}>
                <button
                  onClick={() => { if (expanded) setSocialOpen((o) => !o); else router.push('/admin/social'); }}
                  className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                    parentActive
                      ? 'bg-[var(--button-hover)] text-[var(--text)]'
                      : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                  } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
                  title={!expanded ? item.label : undefined}
                >
                  {item.icon && <item.icon />}
                  {expanded && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      <ChevronDownIcon
                        className={`size-3 transition-transform duration-200 ${socialOpen ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </>
                  )}
                </button>
                {expanded && socialOpen && (
                  <div className="ml-2 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href, pathname);
                      return (
                        <button
                          key={child.id}
                          onClick={() => router.push(child.href)}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            childActive
                              ? 'bg-[var(--button-hover)] text-[var(--text)]'
                              : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${childActive ? 'bg-current' : 'bg-[var(--text-dim)]'}`} />
                          <span className="truncate">{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const Icon = item.icon;
          const active = item.href ? isActive(item.href, pathname) : false;
          return (
            <button
              key={item.id}
              onClick={() => item.href && router.push(item.href)}
              className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
              } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
              title={!expanded ? item.label : undefined}
            >
              {Icon && <Icon />}
              <span className={`truncate ${expanded ? '' : 'hidden'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <button
          onClick={() => router.push(PROFILE_ITEM.href!)}
          className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
            isActive(PROFILE_ITEM.href!, pathname)
              ? 'bg-[var(--button-hover)] text-[var(--text)]'
              : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
          } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
          title={!expanded ? PROFILE_ITEM.label : undefined}
        >
          <Avatar src="/person-2.png" alt="Profile" fallback="AW" className={`${expanded ? 'size-7' : 'size-7'}`} />
          {expanded && <span className="truncate">{profile.name || 'Adam Workcraft'}</span>}
        </button>
      </div>
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
  const [socialOpen, setSocialOpen] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '' });
  useEffect(() => { setProfile(loadProfile()); }, []);

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-[var(--bg-mid)] shadow-xl transition-transform duration-300 ease-in-out ${
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
          {MAIN_ITEMS.map((item) => {
            if (item.children) {
              const parentActive = isActive('/admin/social', pathname);
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setSocialOpen((o) => !o)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      parentActive
                        ? 'bg-[var(--button-hover)] text-[var(--text)]'
                        : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                    }`}
                  >
                    {item.icon && <item.icon />}
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    <ChevronDownIcon
                      className={`size-3 transition-transform duration-200 ${socialOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  {socialOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                      {item.children.map((child) => {
                        const childActive = isActive(child.href, pathname);
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNav(child.href)}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              childActive
                                ? 'bg-[var(--button-hover)] text-[var(--text)]'
                                : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${childActive ? 'bg-current' : 'bg-[var(--text-dim)]'}`} />
                            <span className="truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = item.icon;
            const active = item.href ? isActive(item.href, pathname) : false;
            return (
              <button
                key={item.id}
                onClick={() => item.href && handleNav(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--button-hover)] text-[var(--text)]'
                    : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                }`}
              >
                {Icon && <Icon />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <button
            onClick={() => handleNav(PROFILE_ITEM.href!)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(PROFILE_ITEM.href!, pathname)
                ? 'bg-[var(--button-hover)] text-[var(--text)]'
                : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
            }`}
          >
            <Avatar src="/person-2.png" alt="Profile" fallback="AW" className="size-7" />
            <span className="truncate">{profile.name || 'Adam Workcraft'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
