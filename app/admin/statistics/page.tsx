'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import NumberFlow from '@number-flow/react';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatisticsLoadingSkeleton } from '@/components/admin/loading';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { fetchAdminVisits, type VisitItem, type VisitSummary } from '@/lib/services/admin-statistics';

const PAGE_SIZE = 20;

const BROWSER_OPTIONS = [
  { value: '', label: 'All Browsers' },
  { value: 'Chrome', label: 'Chrome' },
  { value: 'Safari', label: 'Safari' },
  { value: 'Firefox', label: 'Firefox' },
  { value: 'Edge', label: 'Edge' },
  { value: 'Opera', label: 'Opera' },
  { value: 'Other', label: 'Other' },
];

const DEVICE_OPTIONS = [
  { value: '', label: 'All Devices' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Tablet', label: 'Tablet' },
];

function extractHost(url: string | null): string {
  if (!url) return 'Direct';
  try {
    return new URL(url).host;
  } catch {
    return 'Direct';
  }
}

function TopListCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-[var(--text-dim)]">No data in selected range.</p>
        ) : (
          items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-[var(--text-muted)]">{item.label}</span>
                <span className="font-semibold text-[var(--text)]">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-amber-400/80"
                  style={{ width: `${Math.max(8, Math.round((item.count / max) * 100))}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [summary, setSummary] = useState<VisitSummary>({
    total: 0,
    today: 0,
    topBrowsers: [],
    topPages: [],
    topDevices: [],
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [browser, setBrowser] = useState('');
  const [deviceType, setDeviceType] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');

  const loadVisits = useCallback(async (options?: { signal?: AbortSignal; background?: boolean }) => {
    const background = options?.background === true || hasLoadedOnce;

    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError('');
    }

    try {
      const response = await fetchAdminVisits({
        page,
        pageSize: PAGE_SIZE,
        browser,
        deviceType,
        search,
        signal: options?.signal,
      });

      setVisits(response.visits);
      setSummary(response.summary);
      setTotalRows(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setError('');
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') return;

      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load statistics';
      const normalized = message.toLowerCase();

      if (normalized.includes('unauthorized')) {
        setLastPage('/admin/statistics');
        router.replace('/admin/login');
        return;
      }

      setError(message);
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }

      if (!hasLoadedOnce) setHasLoadedOnce(true);
    }
  }, [page, browser, deviceType, search, hasLoadedOnce, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/statistics');
      router.replace('/admin/login');
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
    const controller = new AbortController();
    void loadVisits({ signal: controller.signal });
    return () => controller.abort();
  }, [loadVisits]);

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

  const handleApplySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleChangeBrowser = (value: string) => {
    setBrowser(value);
    setPage(1);
  };

  const handleChangeDevice = (value: string) => {
    setDeviceType(value);
    setPage(1);
  };

  const totalUniquePaths = useMemo(() => new Set(visits.map((visit) => visit.path)).size, [visits]);
  const showInitialSkeleton = isLoading && !hasLoadedOnce;

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
              title="Page Statistics"
              description="Track landing-page visits by browser, device, source, and visit time"
              actions={
                isRefreshing && hasLoadedOnce ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
                    <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                    Updating...
                  </span>
                ) : null
              }
            />

            {showInitialSkeleton ? (
              <StatisticsLoadingSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Card>
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs text-[var(--text-dim)]">Total Visits</p>
                      <p className="text-2xl font-semibold text-[var(--text)]"><NumberFlow value={summary.total} /></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs text-[var(--text-dim)]">Today</p>
                      <p className="text-2xl font-semibold text-[var(--text)]"><NumberFlow value={summary.today} /></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs text-[var(--text-dim)]">Rows In View</p>
                      <p className="text-2xl font-semibold text-[var(--text)]"><NumberFlow value={visits.length} /></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs text-[var(--text-dim)]">Unique Pages In View</p>
                      <p className="text-2xl font-semibold text-[var(--text)]"><NumberFlow value={totalUniquePaths} /></p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px_200px_auto]">
                    <div className="flex items-center gap-2">
                      <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search path, browser, OS, referrer..."
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleApplySearch();
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleApplySearch}
                        className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                      >
                        Apply
                      </Button>
                    </div>
                    <Select value={browser} options={BROWSER_OPTIONS} onChange={handleChangeBrowser} />
                    <Select value={deviceType} options={DEVICE_OPTIONS} onChange={handleChangeDevice} />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchInput('');
                        setSearch('');
                        setBrowser('');
                        setDeviceType('');
                        setPage(1);
                      }}
                      className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      Reset
                    </Button>
                  </CardContent>
                </Card>

                {error && (
                  <Card className="border-red-500/40">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <p className="text-sm text-red-300">{error}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void loadVisits({ background: true })}
                        className="border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 xl:grid-cols-3">
                  <TopListCard title="Top Browsers" items={summary.topBrowsers} />
                  <TopListCard title="Top Pages" items={summary.topPages} />
                  <TopListCard title="Top Devices" items={summary.topDevices} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Visit Log</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visits.length === 0 ? (
                      <p className="py-8 text-center text-sm text-[var(--text-dim)]">No visit data for current filters.</p>
                    ) : (
                      <>
                        <div className="hidden grid-cols-12 gap-3 rounded-lg border border-[var(--border)] bg-[var(--button)]/50 p-3 text-[11px] uppercase tracking-wide text-[var(--text-dim)] md:grid">
                          <span className="col-span-2">Visited At</span>
                          <span className="col-span-2">Page</span>
                          <span className="col-span-2">Browser / OS</span>
                          <span className="col-span-2">Device</span>
                          <span className="col-span-2">Language / Country</span>
                          <span className="col-span-2">Referrer</span>
                        </div>

                        <div className="space-y-2">
                          {visits.map((visit) => (
                            <div key={visit.id} className="rounded-lg border border-[var(--border)] p-3">
                              <div className="grid gap-3 md:grid-cols-12 md:items-center">
                                <div className="md:col-span-2">
                                  <p className="text-xs font-medium text-[var(--text)]">{format(new Date(visit.visitedAt), 'MMM d, yyyy')}</p>
                                  <p className="text-[11px] text-[var(--text-dim)]">{format(new Date(visit.visitedAt), 'h:mm:ss a')}</p>
                                </div>

                                <div className="md:col-span-2">
                                  <p className="truncate text-sm text-[var(--text)]" title={visit.path}>{visit.path}</p>
                                </div>

                                <div className="md:col-span-2">
                                  <p className="text-sm text-[var(--text)]">{visit.browser}</p>
                                  <p className="text-[11px] text-[var(--text-dim)]">{visit.os}</p>
                                </div>

                                <div className="md:col-span-2">
                                  <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--button)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                                    {visit.deviceType}
                                  </span>
                                </div>

                                <div className="md:col-span-2">
                                  <p className="text-xs text-[var(--text)]">{visit.language || '-'}</p>
                                  <p className="text-[11px] text-[var(--text-dim)]">{visit.country || '-'}</p>
                                </div>

                                <div className="md:col-span-2">
                                  <p className="truncate text-xs text-[var(--text-muted)]" title={visit.referrer || 'Direct'}>
                                    {extractHost(visit.referrer)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-[var(--text-dim)]">
                        Showing page {page} of {totalPages} · {totalRows} total rows
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPage((value) => Math.max(1, value - 1))}
                          disabled={page <= 1}
                          className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                          disabled={page >= totalPages}
                          className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
