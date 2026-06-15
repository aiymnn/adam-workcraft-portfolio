'use client';

import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { AdminSummaryGrid } from '@/components/admin/shared/admin-insights-ui';
import type { TikTokProfile, TikTokVideo } from '@/lib/server/tiktok';

function TikTokDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [profile, setProfile] = useState<TikTokProfile | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Authenticate check
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/social/tiktok');
      router.replace('/admin/login');
    }
  }, [router]);

  // 2. Responsive layout hooks
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

  // 3. Load TikTok dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social/tiktok/analytics');
      if (!res.ok) throw new Error('Failed to load TikTok analytics');
      const data = await res.json();
      if (data.success) {
        setConnected(data.connected);
        setIsMock(data.isMock || false);
        setProfile(data.profile || null);
        setVideos(data.videos || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // 4. Handle query parameters (success or errors from OAuth redirect)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast.success('Successfully connected TikTok account!');
      // Remove query parameters from URL
      router.replace('/admin/social/tiktok');
      void loadData();
    } else if (error) {
      let message = 'Failed to connect TikTok.';
      if (error === 'state_mismatch') message = 'Security verification failed (state mismatch).';
      else if (error === 'token_exchange_failed') message = 'Token exchange with TikTok failed.';
      else if (error === 'server_credentials_missing') message = 'Server TikTok credentials are not configured.';
      else message = decodeURIComponent(error);

      toast.error(message);
      router.replace('/admin/social/tiktok');
    }
  }, [searchParams]);

  // 5. Connect/Disconnect actions
  const handleConnect = () => {
    setActionLoading(true);
    window.location.href = '/api/admin/social/tiktok/auth';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your TikTok account? This will remove all stored credentials.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/api/admin/social/tiktok/analytics', {
        method: 'DELETE',
      });
      // Fallback if URL rewrite/pathing is slightly off
      const finalRes = res.ok ? res : await fetch('/api/admin/social/tiktok/analytics', { method: 'DELETE' });
      if (!finalRes.ok) throw new Error('Failed to disconnect');
      toast.success('Disconnected TikTok account.');
      setConnected(false);
      setProfile(null);
      setVideos([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Analytics computation
  const stats = useMemo(() => {
    if (!profile || videos.length === 0) return { totalViews: 0, avgEngagement: '0%' };
    const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
    const totalLikes = videos.reduce((acc, v) => acc + v.likes, 0);
    const totalComments = videos.reduce((acc, v) => acc + v.comments, 0);
    const avgEngagement = totalViews > 0
      ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1) + '%'
      : '0%';
    return { totalViews, avgEngagement };
  }, [profile, videos]);

  // 7. Custom SVG area chart calculations (Views trend)
  const viewsChartPath = useMemo(() => {
    if (videos.length < 2) return { line: '', area: '', points: [] };
    const width = 500;
    const height = 150;
    const paddingX = 30;
    const paddingY = 20;

    // Reverse videos to show chronological order (oldest to newest)
    const sorted = [...videos].reverse();
    const maxVal = Math.max(...sorted.map((v) => v.views)) || 1;

    const points = sorted.map((v, i) => {
      const x = paddingX + (i * (width - paddingX * 2)) / (sorted.length - 1);
      const y = height - paddingY - (v.views * (height - paddingY * 2)) / maxVal;
      return { x, y, val: v.views, label: `Video ${sorted.length - i}` };
    });

    const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
    const areaPath = `${linePath} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

    return { line: linePath, area: areaPath, points };
  }, [videos]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
              title="TikTok Integration"
              description="Monitor your TikTok account status, fetch content, and review audience analytics"
            />

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
                <span className="ml-3 text-sm text-[var(--text-dim)]">Loading dashboard data...</span>
              </div>
            ) : !connected ? (
              // DISCONNECTED STATE UI
              <div className="mx-auto max-w-xl py-12">
                <Card className="border border-[var(--border)] bg-[var(--bg-mid)]/40 p-6 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-stone-900/60 border border-stone-800 text-stone-300">
                    <svg className="size-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <CardHeader className="pt-4 pb-2">
                    <CardTitle className="text-xl">Connect your TikTok Account</CardTitle>
                    <CardDescription className="max-w-md mx-auto">
                      Link your TikTok account to automatically synchronize public video analytics, likes, comments, and follower metrics inside your portfolio dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="w-full sm:w-auto bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 text-white font-medium px-8 py-2.5 rounded-xl shadow-lg transition-all"
                    >
                      {actionLoading ? 'Redirecting...' : 'Sign In with TikTok'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // CONNECTED STATE UI
              <div className="space-y-6">
                {isMock && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-200">
                    <div className="flex items-center gap-2">
                      <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs md:text-sm font-medium">
                        <strong>Sandbox Mode:</strong> Displaying high-fidelity mock data. Real API calls are restricted by TikTok developer sandbox access levels.
                      </span>
                    </div>
                  </div>
                )}

                {/* Account Integration & Summary stats */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Profile details */}
                  <Card className="md:col-span-1">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-semibold">Account Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={profile?.avatarUrl || '/person-2.png'}
                          alt={profile?.displayName}
                          className="size-12 rounded-full border border-[var(--border)] object-cover"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-sm truncate">{profile?.displayName}</p>
                          <p className="text-xs text-[var(--text-dim)] truncate">@{profile?.username}</p>
                        </div>
                      </div>
                      <div className="border-t border-[var(--border)] pt-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-dim)]">Status:</span>
                          <span className="text-emerald-400 font-semibold">Connected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-dim)]">Sync frequency:</span>
                          <span>On demand / Auto</span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnect}
                        disabled={actionLoading}
                        className="w-full text-xs py-1.5 h-auto bg-stone-900 hover:bg-red-950/40 text-stone-400 hover:text-red-300 border border-stone-800 transition-colors"
                      >
                        {actionLoading ? 'Disconnecting...' : 'Disconnect Account'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Summary numeric values */}
                  <div className="md:col-span-2">
                    <AdminSummaryGrid
                      items={[
                        { label: 'Followers', value: formatNumber(profile?.followerCount || 0) },
                        { label: 'Total Likes', value: formatNumber(profile?.likeCount || 0) },
                        { label: 'Videos Count', value: profile?.videoCount || 0 },
                        { label: 'Recent Video Views', value: formatNumber(stats.totalViews) },
                        { label: 'Avg Engagement', value: stats.avgEngagement },
                      ]}
                    />
                  </div>
                </div>

                {/* Custom Line Chart for Views Trend */}
                {videos.length >= 2 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Video Views Trend</CardTitle>
                        <CardDescription>Views of your latest {videos.length} videos (chronological)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative w-full aspect-[2/1] bg-stone-950/20 border border-[var(--border)] rounded-xl p-2 flex items-center justify-center">
                          <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path d={viewsChartPath.area} fill="url(#chartGradient)" />
                            {/* Line stroke */}
                            <path d={viewsChartPath.line} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                            {/* Interactive dots */}
                            {viewsChartPath.points.map((p, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r="4"
                                  fill="#0c0a09"
                                  stroke="#f59e0b"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:r-6 transition-all"
                                />
                                {/* Quick numeric labels */}
                                <text
                                  x={p.x}
                                  y={p.y - 8}
                                  textAnchor="middle"
                                  fill="#d6d3d1"
                                  fontSize="8"
                                  fontWeight="600"
                                >
                                  {formatNumber(p.val)}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recent Engagement Rate</CardTitle>
                        <CardDescription>Engagement metrics (likes/comments) compared with video reach</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-center h-[178px]">
                        <div className="space-y-4">
                          {videos.slice(0, 3).map((video) => {
                            const engagementRate = video.views > 0
                              ? ((video.likes + video.comments) / video.views * 100).toFixed(1)
                              : '0.0';
                            return (
                              <div key={video.id} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="truncate max-w-[70%]">{video.title}</span>
                                  <span className="text-amber-400 font-bold">{engagementRate}%</span>
                                </div>
                                <div className="h-2 w-full bg-stone-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                                    style={{ width: `${Math.min(100, parseFloat(engagementRate) * 5)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Content feed table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Content Performance</CardTitle>
                    <CardDescription>Live metrics of your latest video releases on TikTok</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-stone-900/30 text-[var(--text-dim)] uppercase tracking-wider font-semibold">
                            <th className="p-4">Video Details</th>
                            <th className="p-4">Views</th>
                            <th className="p-4">Likes</th>
                            <th className="p-4">Comments</th>
                            <th className="p-4">Shares</th>
                            <th className="p-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {videos.map((video) => (
                            <tr key={video.id} className="hover:bg-stone-900/10 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <div className="relative size-12 shrink-0 rounded-lg overflow-hidden border border-stone-800 bg-stone-900 flex items-center justify-center">
                                  {video.coverUrl ? (
                                    <img src={video.coverUrl} alt="Cover" className="size-full object-cover" />
                                  ) : (
                                    <svg className="size-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="overflow-hidden max-w-xs md:max-w-md">
                                  <p className="font-semibold text-stone-200 truncate" title={video.title}>
                                    {video.title}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                                    Released: {new Date(video.createTime * 1000).toLocaleDateString()}
                                  </p>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-stone-300">{formatNumber(video.views)}</td>
                              <td className="p-4 text-stone-300">{formatNumber(video.likes)}</td>
                              <td className="p-4 text-stone-300">{formatNumber(video.comments)}</td>
                              <td className="p-4 text-stone-300">{formatNumber(video.shares)}</td>
                              <td className="p-4 text-center">
                                <a
                                  href={video.shareUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[var(--text-dim)] hover:text-amber-200 transition-colors"
                                >
                                  <span>Open</span>
                                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}

export default function TikTokDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="size-8 animate-spin rounded-full border-2 border-stone-600/30 border-t-amber-500" />
      </div>
    }>
      <TikTokDashboardContent />
    </Suspense>
  );
}
