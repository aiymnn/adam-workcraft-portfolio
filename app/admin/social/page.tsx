'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, EditIcon, CheckIcon } from '@/components/shared/icons';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { SOCIAL_PLATFORMS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { SocialLinksLoadingSkeleton } from '@/components/admin/loading';
import { AdminSearchFilterBar, AdminSummaryGrid } from '@/components/admin/shared/admin-insights-ui';
import { fetchAdminSocialLinks, saveAdminSocialLinks } from '@/lib/services/admin-social-links';
import type { PublicSocialLinks } from '@/types/content';

const SOCIAL_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'connected', label: 'Connected' },
  { id: 'missing', label: 'Missing' },
];

export default function SocialPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  const [links, setLinks] = useState<PublicSocialLinks>({ x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' });
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'connected' | 'missing'>('all');
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/social');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const rows = await fetchAdminSocialLinks();
        if (!active) return;
        setLinks(rows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Failed to load social links');
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [toast]);

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

  const handleSave = async () => {
    try {
      const savedLinks = await saveAdminSocialLinks(links);
      setLinks(savedLinks);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('All links saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save social links');
    }
  };

  const socialStats = useMemo(() => {
    const total = SOCIAL_PLATFORMS.length;
    const connected = SOCIAL_PLATFORMS.filter((platform) => (links[platform.id] || '').trim().length > 0).length;
    const missing = total - connected;
    return {
      total,
      connected,
      missing,
    };
  }, [links]);

  const filteredPlatforms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SOCIAL_PLATFORMS.filter((platform) => {
      const linkValue = (links[platform.id] || '').trim();
      const isConnected = linkValue.length > 0;

      if (connectionFilter === 'connected' && !isConnected) return false;
      if (connectionFilter === 'missing' && isConnected) return false;

      if (!query) return true;
      return (
        platform.label.toLowerCase().includes(query) ||
        platform.id.toLowerCase().includes(query)
      );
    });
  }, [links, searchQuery, connectionFilter]);

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

            {isBootstrapping ? (
              <SocialLinksLoadingSkeleton />
            ) : (
              <div className="space-y-4">
                <AdminSummaryGrid
                  items={[
                    { label: 'Total Platforms', value: socialStats.total },
                    { label: 'Connected', value: socialStats.connected },
                    { label: 'Missing', value: socialStats.missing },
                    { label: 'Completion', value: socialStats.total > 0 ? Math.round((socialStats.connected / socialStats.total) * 100) : 0 },
                  ]}
                />

                <AdminSearchFilterBar
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  queryPlaceholder="Search platform by name"
                  filterOptions={SOCIAL_FILTER_OPTIONS}
                  activeFilter={connectionFilter}
                  onFilterChange={(value) => setConnectionFilter(value as 'all' | 'connected' | 'missing')}
                />

                {filteredPlatforms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[var(--text)]">No matching platform found</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">Try a different search or connection filter.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredPlatforms.map((platform) => (
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
                )}
              </div>
            )}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
