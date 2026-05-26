'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { SOCIAL_PLATFORMS, type SocialPlatformId } from '@/lib/constants';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import PlatformDashboard from '../_components/platform-dashboard';
import { getDummyData } from '../_components/dummy-data';

export default function PlatformPage() {
  const router = useRouter();
  const params = useParams();
  const platformId = params.platform as SocialPlatformId;

  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage(`/admin/social/${platformId}`);
      router.replace('/admin/login');
    }
  }, [router, platformId]);

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

  if (!platform) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-[var(--text-dim)]">Platform not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/social')} className="mt-4 border border-[var(--border)]">
          Back to Social Media
        </Button>
      </div>
    );
  }

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

        <main className="flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title={platform.label}
              description="Analytics and performance overview"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/admin/social')}
                  className="border border-[var(--border)]"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span>All Links</span>
                </Button>
              }
            />

            <PlatformDashboard data={useMemo(() => getDummyData(platformId), [platformId])} platformId={platformId} />
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
