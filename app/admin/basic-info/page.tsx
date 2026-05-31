'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

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

export default function BasicInfoPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState({ name: DUMMY_DATA.name, email: DUMMY_DATA.email });
  const [socials, setSocials] = useState(DUMMY_DATA.socials);
  const manualToggleRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated()) {
        setLastPage('/admin/basic-info');
        router.replace('/admin/login');
        return;
      }
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

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {isMobile ? (
          <MobileSidebar
            open={mobileSidebarOpen}
            onClose={() => { setMobileSidebarOpen(false); document.body.style.overflow = ''; }}
          />
        ) : (
          <DesktopSidebar expanded={sidebarExpanded} />
        )}

        <main className="scrollbar-hidden flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title="Basic Info"
              description="Manage your basic information and social links"
            />
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
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
