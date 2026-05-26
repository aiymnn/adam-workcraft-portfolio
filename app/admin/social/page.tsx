'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, EditIcon, CheckIcon } from '@/components/shared/icons';
import { isAuthenticated, setLastPage, logout } from '@/lib/services/auth';
import { SOCIAL_PLATFORMS, type SocialPlatformId, loadSocialLinks, saveSocialLinks } from '@/lib/constants';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

export default function SocialPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  const [links, setLinks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/social');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    setLinks(loadSocialLinks());
  }, []);

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

  const handleSignOut = () => {
    logout();
    router.push('/admin/login');
  };

  const handleSave = () => {
    saveSocialLinks(links as Record<SocialPlatformId, string>);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
        onSignOut={handleSignOut}
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

        <main className="flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title="Social Media"
              description="Manage all your social media links in one place"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  {saved ? (
                    <><CheckIcon className="size-4" /><span>Saved</span></>
                  ) : (
                    <><CheckIcon className="size-4" /><span>Save All</span></>
                  )}
                </Button>
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              {SOCIAL_PLATFORMS.map((platform) => (
                <Card key={platform.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{platform.label}</CardTitle>
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/admin/social/${platform.id}`)}
                          className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                          title="Edit on separate page"
                        >
                          <EditIcon className="size-3.5" />
                        </button>
                        {(links[platform.id] || '').trim() && (
                          <a
                            href={links[platform.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                            title="Open link"
                          >
                            <ExternalLinkIcon className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <CardDescription>Enter your {platform.label} profile URL</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={links[platform.id] || ''}
                      onChange={(e) => setLinks((prev) => ({ ...prev, [platform.id]: e.target.value }))}
                      placeholder="https://..."
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
