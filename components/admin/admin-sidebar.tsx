'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { GridIcon, PersonIcon, CalendarIcon, ShareIcon, FolderIcon, BarChartIcon, ExternalLinkIcon, LogoutIcon, ChevronDownIcon, XIcon, MailIcon } from '@/components/shared/icons';
import { DEFAULT_PROFILE, PROFILE_UPDATED_EVENT, SOCIAL_PLATFORMS, type SocialPlatformId, type AdminProfile, loadProfile } from '@/lib/constants';
import { logout } from '@/lib/services/auth';
import { fetchAdminMessageSummary } from '@/lib/services/admin-messages';
import { useToast } from '@/hooks/use-toast';

const ADMIN_MESSAGES_UPDATED_EVENT = 'admin-messages-updated';

function useUnreadMessagesCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const summary = await fetchAdminMessageSummary();
        if (active) {
          setUnreadCount(summary.unreadCount);
        }
      } catch {
      }
    };

    void sync();

    const interval = window.setInterval(() => {
      void sync();
    }, 45000);

    window.addEventListener(ADMIN_MESSAGES_UPDATED_EVENT, sync as EventListener);
    document.addEventListener('visibilitychange', sync);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener(ADMIN_MESSAGES_UPDATED_EVENT, sync as EventListener);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return unreadCount;
}

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
  { id: 'messages', label: 'Messages', href: '/admin/messages', icon: MailIcon },
  { id: 'statistics', label: 'Statistics', href: '/admin/statistics', icon: BarChartIcon },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: FolderIcon,
    children: [
      { id: 'vault', label: 'Personal Vault', href: '/admin/gallery/vault' },
      { id: 'reviews', label: 'Review Collection', href: '/admin/gallery/reviews' },
      { id: 'pending-reviews', label: 'Pending Reviews', href: '/admin/reviews/pending' },
      { id: 'public-collection', label: 'Public Collection', href: '/admin/gallery/public-collection' },
    ],
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: ShareIcon,
    children: [
      { id: 'all', label: 'All Links', href: '/admin/social' },
      { id: 'tiktok-dashboard', label: 'TikTok Dashboard', href: '/admin/social/tiktok' },
      ...SOCIAL_PLATFORMS.map((p) => ({
        id: p.id as SocialPlatformId,
        label: p.label,
        href: `/admin/social/${p.id}` as const,
      })),
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin/social') return pathname === '/admin/social';
  return pathname === href || pathname.startsWith(href + '/');
}

function ProfileMenuItems({
  navigate,
  pathname,
  onViewSite,
}: {
  navigate: (href: string) => void;
  pathname: string;
  onViewSite?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    toast.info('Signed out');
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="ml-2 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
      <button
        onClick={() => navigate('/admin/profile')}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          isActive('/admin/profile', pathname)
            ? 'bg-[var(--button-hover)] text-[var(--text)]'
            : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
        }`}
      >
        <PersonIcon className="size-3.5" />
        <span className="truncate">Profile Settings</span>
      </button>
      <button
        onClick={() => { window.open('/', '_blank'); onViewSite?.(); }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text-muted)]"
      >
        <ExternalLinkIcon className="size-3.5" />
        <span className="truncate">View Site</span>
      </button>
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text-muted)]"
      >
        <LogoutIcon className="size-3.5" />
        <span className="truncate">Sign Out</span>
      </button>
    </div>
  );
}

interface DesktopSidebarProps {
  expanded: boolean;
}

export function DesktopSidebar({ expanded }: DesktopSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({
    gallery: true,
    social: true,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const unreadMessages = useUnreadMessagesCount();
  useEffect(() => {
    const refreshProfile = () => setProfile(loadProfile());

    const frame = window.requestAnimationFrame(refreshProfile);
    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile as EventListener);
    window.addEventListener('storage', refreshProfile);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile as EventListener);
      window.removeEventListener('storage', refreshProfile);
    };
  }, []);

  const toggleParent = useCallback((id: string) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <aside
      className="shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-mid)]/60 transition-[width] duration-300 ease-in-out flex flex-col"
      style={{ willChange: 'width', width: expanded ? '14rem' : '3.5rem' }}
    >
      <nav className="scrollbar-hidden flex-1 space-y-1 overflow-y-auto p-3">
        {MAIN_ITEMS.map((item) => {
          if (item.children) {
            const parentActive = isActive('/admin/' + item.id, pathname);
            const parentOpen = openParents[item.id] ?? true;
            const children = item.children;
            return (
              <div key={item.id}>
                <button
                  onClick={() => { if (expanded) toggleParent(item.id); else router.push(children[0].href); }}
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
                        className={`size-3 transition-transform duration-200 ${parentOpen ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </>
                  )}
                </button>
                {expanded && parentOpen && (
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
              } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'} relative`}
              title={!expanded ? item.label : undefined}
            >
              {Icon && <Icon />}
              <span className={`truncate ${expanded ? '' : 'hidden'}`}>{item.label}</span>
              {item.id === 'messages' && unreadMessages > 0 && expanded && (
                <span className="ml-auto rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
              {item.id === 'messages' && unreadMessages > 0 && !expanded && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-300" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        {!expanded ? (
          <button
            onClick={() => router.push('/admin/profile')}
            className="flex w-full items-center justify-center rounded-lg py-2 text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text-muted)]"
            title="Profile"
          >
            <Avatar src={profile.avatarUrl} alt="Profile" fallback={profile.name || 'AW'} className="size-7" />
          </button>
        ) : (
          <div>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/admin/profile', pathname) || profileOpen
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
              }`}
            >
              <Avatar src={profile.avatarUrl} alt="Profile" fallback={profile.name || 'AW'} className="size-7" />
              <span className="flex-1 truncate text-left">{profile.name || 'Adam Workcraft'}</span>
              <ChevronDownIcon
                className={`size-3 transition-transform duration-200 ${profileOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            {profileOpen && (
              <ProfileMenuItems
                navigate={router.push}
                pathname={pathname}
              />
            )}
          </div>
        )}
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
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({
    gallery: true,
    social: true,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const unreadMessages = useUnreadMessagesCount();
  useEffect(() => {
    const refreshProfile = () => setProfile(loadProfile());

    const frame = window.requestAnimationFrame(refreshProfile);
    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile as EventListener);
    window.addEventListener('storage', refreshProfile);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile as EventListener);
      window.removeEventListener('storage', refreshProfile);
    };
  }, []);

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const toggleParent = useCallback((id: string) => {
    setOpenParents((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

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

        <nav className="scrollbar-hidden flex-1 space-y-1 overflow-y-auto p-4">
          {MAIN_ITEMS.map((item) => {
            if (item.children) {
              const parentActive = isActive('/admin/' + item.id, pathname);
              const parentOpen = openParents[item.id] ?? true;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleParent(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      parentActive
                        ? 'bg-[var(--button-hover)] text-[var(--text)]'
                        : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                    }`}
                  >
                    {item.icon && <item.icon />}
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    <ChevronDownIcon
                      className={`size-3 transition-transform duration-200 ${parentOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  {parentOpen && (
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
                {item.id === 'messages' && unreadMessages > 0 && (
                  <span className="ml-auto rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive('/admin/profile', pathname) || profileOpen
                ? 'bg-[var(--button-hover)] text-[var(--text)]'
                : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
            }`}
          >
            <Avatar src={profile.avatarUrl} alt="Profile" fallback={profile.name || 'AW'} className="size-7" />
            <span className="flex-1 truncate text-left">{profile.name || 'Adam Workcraft'}</span>
            <ChevronDownIcon
              className={`size-3 transition-transform duration-200 ${profileOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </button>
          {profileOpen && (
            <ProfileMenuItems
              navigate={handleNav}
              pathname={pathname}
              onViewSite={onClose}
            />
          )}
        </div>
      </aside>
    </>
  );
}
