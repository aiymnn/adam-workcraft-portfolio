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
import { fetchAdminSocialLinks, fetchAdminSocialLinkVisibility, saveAdminSocialLinks } from '@/lib/services/admin-social-links';
import type { PublicSocialLinks, PublicSocialLinksVisibility } from '@/types/content';

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
  const [visibility, setVisibility] = useState<PublicSocialLinksVisibility>({ x: true, instagram: true, threads: true, tiktok: true, whatsapp: true });
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
        const [rows, visibilityRows] = await Promise.all([
          fetchAdminSocialLinks(),
          fetchAdminSocialLinkVisibility(),
        ]);
        if (!active) return;
        setLinks(rows);
        setVisibility(visibilityRows);
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
      const savedState = await saveAdminSocialLinks(links, visibility);
      setLinks(savedState.links);
      setVisibility(savedState.visibility);
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
    const visible = SOCIAL_PLATFORMS.filter((platform) => visibility[platform.id]).length;
    const missing = total - connected;
    return {
      total,
      connected,
      visible,
      missing,
    };
  }, [links, visibility]);

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

        <main className="scrollbar-hidden flex-1 overflow-y-auto">
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
                    { label: 'Visible', value: socialStats.visible },
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
                                type="button"
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
                        <CardContent className="space-y-3">
                          <Input
                            value={links[platform.id] || ''}
                            onChange={(e) => setLinks((prev) => ({ ...prev, [platform.id]: e.target.value }))}
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            aria-pressed={visibility[platform.id]}
                            onClick={() => setVisibility((prev) => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${visibility[platform.id] ? 'border-emerald-700/40 bg-emerald-950/20 text-emerald-200' : 'border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)] hover:text-[var(--text)]'}`}
                          >
                            <span className="text-xs font-medium uppercase tracking-[0.18em]">
                              {visibility[platform.id] ? 'Visible on landing' : 'Hidden from landing'}
                            </span>
                            <span className={`relative h-5 w-10 rounded-full transition-colors ${visibility[platform.id] ? 'bg-emerald-500/30' : 'bg-stone-700/60'}`}>
                              <span className={`absolute top-0.5 size-4 rounded-full bg-current transition-transform ${visibility[platform.id] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </span>
                          </button>
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
