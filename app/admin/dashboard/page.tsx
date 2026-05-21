'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useAdminTheme } from '@/app/admin/layout';

const SOCIAL_PLATFORMS = [
  { id: 'x', label: 'X (Twitter)' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

const DUMMY_DATA = {
  name: 'Adam Workcraft',
  email: 'hello@adamworkcraft.com',
  socials: {
    x: 'https://x.com/adamworkcraft',
    instagram: 'https://instagram.com/adamworkcraft',
    threads: 'https://threads.net/@adamworkcraft',
    tiktok: 'https://tiktok.com/@adamworkcraft',
    whatsapp: 'https://wa.me/60123456789',
  },
};

const SIDEBAR_ITEMS = [
  { id: 'basic-info', label: 'Basic Info' },
];

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

function PersonIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useAdminTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [activeSection] = useState('basic-info');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState({ name: DUMMY_DATA.name, email: DUMMY_DATA.email });
  const [socials, setSocials] = useState(DUMMY_DATA.socials);
  const manualToggleRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('admin_auth');
      if (authed !== 'true') {
        router.replace('/admin/login');
        return;
      }
    }
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' },
      );
    }
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };
    setSidebarExpanded(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleToggleSidebar = () => {
    manualToggleRef.current = true;
    if (isMobile) {
      const next = !mobileSidebarOpen;
      setMobileSidebarOpen(next);
      document.body.style.overflow = next ? 'hidden' : '';
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  };

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-start)]/90 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSidebar}
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
            onClick={handleSignOut}
            className="hidden border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] md:inline-flex"
          >
            Sign Out
          </Button>
          <button
            onClick={handleSignOut}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] md:hidden"
            aria-label="Sign Out"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      {isMobile && mobileSidebarOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => { setMobileSidebarOpen(false); document.body.style.overflow = ''; }}
        />
      )}

      <div className="flex flex-1">
        {isMobile ? (
          <aside
            ref={sidebarRef}
            className={`fixed left-0 top-0 z-40 h-full w-56 bg-[var(--bg-mid)] shadow-xl transition-transform duration-300 ease-in-out ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ willChange: 'transform' }}
          >
            <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
              <span className="text-sm font-semibold">Navigation</span>
              <button
                onClick={() => { setMobileSidebarOpen(false); document.body.style.overflow = ''; }}
                className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)]"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-1 p-4">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-[var(--button-hover)] text-[var(--text)]'
                      : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  <PersonIcon />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        ) : (
          <aside
            ref={sidebarRef}
            className={`shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-mid)]/60 transition-[width] duration-300 ease-in-out ${
              sidebarExpanded ? 'w-56' : 'w-14'
            }`}
            style={{ willChange: 'width' }}
          >
            <nav className="space-y-1 p-3">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-[var(--button-hover)] text-[var(--text)]'
                      : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
                  } ${sidebarExpanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
                  title={!sidebarExpanded ? item.label : undefined}
                >
                  <PersonIcon />
                  <span className={`truncate ${sidebarExpanded ? '' : 'hidden'}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 overflow-auto">
          <div ref={contentRef} className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6 md:py-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar src="/person-2.png" alt="Profile" fallback="AW" className="size-12 md:size-14" />
                  <div>
                    <CardTitle className="text-base md:text-lg">Profile</CardTitle>
                    <CardDescription>Your basic information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Social Links</CardTitle>
                <CardDescription>Manage your social media URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div key={platform.id} className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      {platform.label}
                    </label>
                    <Input
                      value={(socials as Record<string, string>)[platform.id]}
                      onChange={(e) =>
                        setSocials((s) => ({ ...s, [platform.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-[var(--text-dim)]">
              Changes are local only — no backend connected
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
