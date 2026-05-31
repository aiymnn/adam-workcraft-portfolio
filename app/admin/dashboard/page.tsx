'use client';

import { useEffect, useRef, useMemo, useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, getDaysInMonth, addMonths, subMonths, addYears, subYears, addWeeks, subWeeks } from 'date-fns';
import NumberFlow from '@number-flow/react';
import type { Booking } from '@/app/admin/schedule/_components/types';
import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/constants';
import { fetchAdminBookings } from '@/lib/services/admin-bookings';
import { fetchAdminDashboardSummary, type DashboardSummary } from '@/lib/services/admin-dashboard';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUpIcon, TrendingDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DashboardLoadingSkeleton } from '@/components/admin/dashboard/dashboard-loading-skeleton';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
] as const;

type Period = (typeof PERIODS)[number]['key'];

const STAT_ICONS: Record<string, string> = {
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  pending: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  xmark: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  accent: string;
  href: string;
  trend?: { value: number; direction: 'up' | 'down' } | null;
}

const StatCard = memo(function StatCard({ label, value, icon, accent, href, trend }: StatCardProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className="group w-full rounded-xl border border-[var(--border)] bg-[var(--bg-start)] text-left shadow-sm transition-all hover:border-[var(--button-hover)] hover:shadow-md"
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[icon]} />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--text-dim)]">{label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
                <NumberFlow value={value} transformTiming={{ duration: 600, easing: 'ease-out' }} />
              </p>
              {trend && (
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trend.direction === 'up' ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </button>
  );
});

function TrendLineChart({ bookings, period, cursor }: { bookings: Booking[]; period: Period; cursor: Date }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<{ label: string; value: number; cx: number; cy: number; index: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, labels } = useMemo(() => {
    if (period === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = endOfWeek(cursor, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      const d = days.map((day) => {
        const ds = format(day, 'yyyy-MM-dd');
        return bookings.filter((b) => b.date === ds).length;
      });
      const labs = days.map((day) => format(day, 'EEE'));
      return { data: d, labels: labs };
    }
    if (period === 'month') {
      const count = getDaysInMonth(cursor);
      const d = Array.from({ length: count }, (_, i) => {
        const ds = format(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1), 'yyyy-MM-dd');
        return bookings.filter((b) => b.date === ds).length;
      });
      const step = Math.max(1, Math.floor(count / 10));
      const labs = Array.from({ length: count }, (_, i) => (i % step === 0 ? `${i + 1}` : ''));
      return { data: d, labels: labs };
    }
    const d = Array.from({ length: 12 }, (_, i) => {
      const m = i.toString().padStart(2, '0');
      return bookings.filter((b) => b.date.startsWith(`${cursor.getFullYear()}-${m}`)).length;
    });
    return { data: d, labels: MONTH_NAMES };
  }, [period, cursor, bookings]);

  const max = Math.max(...data, 1);
  const ptCount = data.length;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 4;
  const svgW = 280;
  const svgH = 110;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const stepX = ptCount > 1 ? chartW / (ptCount - 1) : chartW;

  const points = data
    .map((v, i) => {
      const x = padL + i * stepX;
      const y = padT + chartH - (v / max) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const ratio = relX / rect.width;
      const i = Math.round(ratio * (ptCount - 1));
      const idx = Math.max(0, Math.min(ptCount - 1, i));
      const x = ((idx / (ptCount - 1)) * chartW + padL) / svgW * rect.width;
      const y = (1 - data[idx] / max) * chartH;
      const cy = padT + y;
      setHovered({ label: labels[idx], value: data[idx], cx: x, cy: (cy / svgH) * rect.height, index: idx });
    },
    [data, labels, max, ptCount, chartW, chartH],
  );

  const handlePointerLeave = useCallback(() => setHovered(null), []);

  return (
    <div className="space-y-3">
      <div className="text-right">
        <button
          type="button"
          onClick={() => router.push('/admin/schedule')}
          className="text-[11px] font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
        >
          View all &rarr;
        </button>
      </div>

      <div ref={chartRef} className="relative">
        <svg
          className="w-full"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ cursor: 'pointer' }}
        >
          <polyline
            points={points}
            stroke="#44403c"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points={points}
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="drop-shadow-[0_0_6px_rgba(245,158,11,0.25)]"
          />
          {data.map((v, i) => {
            const cx = padL + i * stepX;
            const cy = padT + chartH - (v / max) * chartH;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={v > 0 ? 3.5 : 2}
                fill={v > 0 ? '#f59e0b' : '#292524'}
                stroke={hovered?.index === i ? '#1c1917' : 'none'}
                strokeWidth={1.5}
                className="transition-[r] duration-100"
                style={{ filter: v === max && v > 0 ? 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' : undefined }}
              />
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: hovered.cx, top: hovered.cy - 8 }}
          >
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] px-2.5 py-1.5 shadow-xl">
              <p className="text-center text-[10px] font-medium text-[var(--text-dim)]">{hovered.label}</p>
              <p className="text-center text-sm font-bold text-[var(--text)]">{hovered.value}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between px-0.5 text-[9px] text-[var(--text-dim)]">
        {labels.map((l, i) => (
          <span key={i} className="text-center" style={{ width: `${100 / ptCount}%` }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ bookings, period, cursor }: { bookings: Booking[]; period: Period; cursor: Date }) {
  const range = useMemo(() => computePeriodRanges(period, cursor), [period, cursor]);
  const filtered = useMemo(() => {
    const s = format(range.start, 'yyyy-MM-dd');
    const e = format(range.end, 'yyyy-MM-dd');
    return bookings.filter((b) => b.date >= s && b.date <= e);
  }, [bookings, range]);

  const segments = useMemo(() => {
    const pending = filtered.filter((b) => b.status === 'pending').length;
    const confirmed = filtered.filter((b) => b.status === 'confirmed').length;
    const cancelled = filtered.filter((b) => b.status === 'cancelled').length;
    return [
      { status: 'confirmed', count: confirmed, color: '#10b981' },
      { status: 'pending', count: pending, color: '#f59e0b' },
      { status: 'cancelled', count: cancelled, color: '#ef4444' },
    ].filter((s) => s.count > 0);
  }, [filtered]);

  const [hoveredSeg, setHoveredSeg] = useState<string | null>(null);
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-[var(--text-dim)]">No data for this period</p>;

  const r = 78;
  const circ = 2 * Math.PI * r;
  const viewSize = 200;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <svg width="100%" height="100%" viewBox={`0 0 ${viewSize} ${viewSize}`} className="max-w-[220px] md:max-w-[240px]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#292524" strokeWidth={18} />
        {segments.map((seg) => {
          const len = (seg.count / total) * circ;
          const dash = `${len} ${circ - len}`;
          const segOffset = -offset;
          offset += len;
          const isHovered = hoveredSeg === seg.status;
          return (
            <circle
              key={seg.status}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? 22 : 18}
              strokeDasharray={dash}
              strokeDashoffset={segOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
              className="cursor-pointer transition-all duration-200"
              style={{ filter: isHovered ? `drop-shadow(0 0 8px ${seg.color}80)` : undefined }}
              onPointerEnter={() => setHoveredSeg(seg.status)}
              onPointerLeave={() => setHoveredSeg(null)}
            >
              <title>{seg.count} booking{seg.count !== 1 ? 's' : ''} ({Math.round((seg.count / total) * 100)}%)</title>
            </circle>
          );
        })}
        <circle cx={cx} cy={cy} r={34} fill="#1c1917" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#a8a29e" fontSize={11} fontWeight={500}>
          Total
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#f5f5f4" fontSize={22} fontWeight={700}>
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-2">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          const isHovered = hoveredSeg === seg.status;
          return (
            <button
              key={seg.status}
              type="button"
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                isHovered
                  ? 'border-[var(--button-hover)] bg-[var(--button)]'
                  : 'border-transparent hover:bg-[var(--button)]'
              }`}
              onPointerEnter={() => setHoveredSeg(seg.status)}
              onPointerLeave={() => setHoveredSeg(null)}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-[var(--text-dim)] capitalize">{seg.status}</span>
              <span className="font-semibold text-[var(--text)]">{seg.count}</span>
              <span className="text-[var(--text-dim)]">({pct}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayOfWeekChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const busiestIdx = data.indexOf(Math.max(...data));

  return (
    <div className="space-y-2">
      {data.map((count, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="w-8 shrink-0 text-right text-[11px] font-medium text-[var(--text-dim)]">{DAY_SHORT[i]}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className={`h-8 rounded-full transition-all duration-500 ${
                i === busiestIdx
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-[var(--button-hover)]'
              }`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-medium text-[var(--text)]">{count}</span>
        </div>
      ))}
    </div>
  );
}

function getTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { value: 100, direction: 'up' };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  return { value: Math.abs(pct), direction: pct > 0 ? 'up' : 'down' };
}

function computePeriodRanges(period: Period, cursor: Date) {
  if (period === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    const prevStart = subWeeks(start, 1);
    const prevEnd = subWeeks(end, 1);
    return { start, end, prevStart, prevEnd, labels: eachDayOfInterval({ start, end }).map((d) => format(d, 'EEE')) };
  }
  if (period === 'month') {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const prevStart = subMonths(start, 1);
    const prevEnd = subMonths(end, 1);
    const days = getDaysInMonth(cursor);
    const step = Math.max(1, Math.floor(days / 6));
    const labs = Array.from({ length: days }, (_, i) => (i % step === 0 ? `${i + 1}` : ''));
    return { start, end, prevStart, prevEnd, labels: labs };
  }
  const start = new Date(cursor.getFullYear(), 0, 1);
  const end = new Date(cursor.getFullYear(), 11, 31);
  const prevStart = subYears(start, 1);
  const prevEnd = subYears(end, 1);
  return { start, end, prevStart, prevEnd, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
}

export default function DashboardPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isRefreshingBookings, setIsRefreshingBookings] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [now, setNow] = useState(new Date());
  const [dashboardPeriod, setDashboardPeriod] = useState<Period>('week');
  const [dashboardCursor, setDashboardCursor] = useState(new Date());

  const periodRange = useMemo(
    () => computePeriodRanges(dashboardPeriod, dashboardCursor),
    [dashboardPeriod, dashboardCursor],
  );

  const periodStartKey = useMemo(() => format(periodRange.start, 'yyyy-MM-dd'), [periodRange]);
  const periodEndKey = useMemo(() => format(periodRange.end, 'yyyy-MM-dd'), [periodRange]);
  const prevPeriodStartKey = useMemo(() => format(periodRange.prevStart, 'yyyy-MM-dd'), [periodRange]);
  const prevPeriodEndKey = useMemo(() => format(periodRange.prevEnd, 'yyyy-MM-dd'), [periodRange]);

  const periodBookings = useMemo(
    () => bookings.filter((b) => b.date >= periodStartKey && b.date <= periodEndKey),
    [bookings, periodStartKey, periodEndKey],
  );

  const fetchFrom = periodStartKey;
  const fetchTo = periodEndKey;

  const loadDashboardBookings = useCallback(async (options?: { background?: boolean; signal?: AbortSignal }) => {
    const isBackground = options?.background === true || hasLoadedOnce;

    if (isBackground) {
      setIsRefreshingBookings(true);
    } else {
      setBookingsError('');
      setIsLoadingBookings(true);
    }

    try {
      const [bookingsResult, summaryResult] = await Promise.allSettled([
        fetchAdminBookings({
          from: fetchFrom,
          to: fetchTo,
          signal: options?.signal,
        }),
        fetchAdminDashboardSummary({
          from: periodStartKey,
          to: periodEndKey,
          prevFrom: prevPeriodStartKey,
          prevTo: prevPeriodEndKey,
          recentLimit: 5,
          signal: options?.signal,
        }),
      ]);

      if (bookingsResult.status === 'rejected') {
        throw bookingsResult.reason;
      }

      setBookings(bookingsResult.value);
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        setSummary(null);
      }
      setBookingsError('');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
      const normalized = message.toLowerCase();

      if (normalized.includes('unauthorized')) {
        setLastPage('/admin/dashboard');
        router.replace('/admin/login');
        return;
      }

      setBookingsError(message);
    } finally {
      if (isBackground) {
        setIsRefreshingBookings(false);
      } else {
        setIsLoadingBookings(false);
      }

      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }
  }, [router, fetchFrom, fetchTo, periodStartKey, periodEndKey, prevPeriodStartKey, prevPeriodEndKey, hasLoadedOnce]);

  const periodStats = summary
    ? {
      total: summary.current.total,
      pending: summary.current.pending,
      confirmed: summary.current.confirmed,
      cancelled: summary.current.cancelled,
      totalTrend: getTrend(summary.current.total, summary.previous.total),
      pendingTrend: getTrend(summary.current.pending, summary.previous.pending),
      confirmedTrend: getTrend(summary.current.confirmed, summary.previous.confirmed),
      cancelledTrend: getTrend(summary.current.cancelled, summary.previous.cancelled),
    }
    : (() => {
      const total = periodBookings.length;
      const pending = periodBookings.filter((b) => b.status === 'pending').length;
      const confirmed = periodBookings.filter((b) => b.status === 'confirmed').length;
      const cancelled = periodBookings.filter((b) => b.status === 'cancelled').length;
      return {
        total,
        pending,
        confirmed,
        cancelled,
        totalTrend: null,
        pendingTrend: null,
        confirmedTrend: null,
        cancelledTrend: null,
      };
    })();

  const handlePrevPeriod = useCallback(() => {
    setDashboardCursor((c) => (
      dashboardPeriod === 'week' ? subWeeks(c, 1)
        : dashboardPeriod === 'month' ? subMonths(c, 1)
          : subYears(c, 1)
    ));
  }, [dashboardPeriod]);

  const handleNextPeriod = useCallback(() => {
    const now = new Date();
    setDashboardCursor((c) => {
      const next = dashboardPeriod === 'week' ? addWeeks(c, 1)
        : dashboardPeriod === 'month' ? addMonths(c, 1)
          : addYears(c, 1);
      return next > now ? now : next;
    });
  }, [dashboardPeriod]);

  const periodNavLabel = useMemo(() => {
    if (dashboardPeriod === 'week') {
      return format(periodRange.start, 'MMM d, yyyy');
    }
    if (dashboardPeriod === 'month') return format(dashboardCursor, 'MMMM yyyy');
    return `${dashboardCursor.getFullYear()}`;
  }, [dashboardPeriod, dashboardCursor, periodRange]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!isAuthenticated()) {
        setLastPage('/admin/dashboard');
        router.replace('/admin/login');
        return;
      }
    }
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboardBookings({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboardBookings]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadDashboardBookings({ background: true });
    }, 60000);
    return () => window.clearInterval(timer);
  }, [loadDashboardBookings]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const recentBookings = useMemo(() => {
    if (summary) return summary.recentBookings;
    return [...periodBookings]
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
      .slice(0, 5);
  }, [summary, periodBookings]);

  const dayOfWeekData = useMemo(() => {
    if (summary && summary.dayOfWeek.length === 7) return summary.dayOfWeek;
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const b of periodBookings) {
      const date = new Date(`${b.date}T00:00:00`);
      const weekday = date.getDay();
      const idx = weekday === 0 ? 6 : weekday - 1;
      counts[idx]++;
    }
    return counts;
  }, [summary, periodBookings]);

  const insights = useMemo(() => {
    const busiestIdx = dayOfWeekData.indexOf(Math.max(...dayOfWeekData));

    if (summary) {
      return {
        topSvc: summary.topService,
        busiestDay: DAY_SHORT[summary.busiestDayIndex] || DAY_SHORT[busiestIdx],
        avgWeek: `${summary.current.total}`,
      };
    }

    const svcMap = new Map<string, number>();
    for (const b of periodBookings) svcMap.set(b.service, (svcMap.get(b.service) || 0) + 1);
    const topSvc = [...svcMap.entries()].sort((a, b) => b[1] - a[1])[0];
    return { topSvc: topSvc ? { name: topSvc[0], count: topSvc[1] } : null, busiestDay: DAY_SHORT[busiestIdx], avgWeek: `${periodBookings.length}` };
  }, [summary, periodBookings, dayOfWeekData]);

  const showInitialSkeleton = isLoadingBookings && !hasLoadedOnce && bookings.length === 0;

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
              title={`${getGreeting()}, Adam`}
              description={format(now, 'EEEE, MMMM d, yyyy — h:mm a')}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/admin/schedule')}
                    className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span>View Schedule</span>
                  </Button>
                </div>
              }
            />

            {bookingsError && (
              <Card className="border-red-500/40">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm text-red-300">{bookingsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadDashboardBookings({ background: true })}
                    disabled={isLoadingBookings || isRefreshingBookings}
                    className="border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {showInitialSkeleton ? (
              <DashboardLoadingSkeleton />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-0.5 rounded-lg border border-[var(--border)] p-0.5">
                    {PERIODS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => { setDashboardPeriod(p.key); setDashboardCursor(new Date()); }}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          dashboardPeriod === p.key
                            ? 'bg-[var(--button-hover)] text-[var(--text)]'
                            : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    {isRefreshingBookings && hasLoadedOnce && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-dim)]">
                        <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                        Updating...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handlePrevPeriod}
                      className="flex size-6 items-center justify-center rounded text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
                    >
                      <ChevronLeftIcon className="size-3" />
                    </button>
                    <span className="text-xs font-medium text-[var(--text-muted)]">{periodNavLabel}</span>
                    <button
                      type="button"
                      onClick={handleNextPeriod}
                      className="flex size-6 items-center justify-center rounded text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
                    >
                      <ChevronRightIcon className="size-3" />
                    </button>
                  </div>
              </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                  <StatCard label="Total Bookings" value={periodStats.total} icon="calendar" accent="bg-sky-900/40 text-sky-400" href="/admin/schedule" trend={periodStats.totalTrend} />
                  <StatCard label="Pending" value={periodStats.pending} icon="pending" accent="bg-amber-900/40 text-amber-300" href="/admin/schedule" trend={periodStats.pendingTrend} />
                  <StatCard label="Confirmed" value={periodStats.confirmed} icon="check" accent="bg-emerald-900/40 text-emerald-300" href="/admin/schedule" trend={periodStats.confirmedTrend} />
                  <StatCard label="Cancelled" value={periodStats.cancelled} icon="xmark" accent="bg-red-900/40 text-red-300" href="/admin/schedule" trend={periodStats.cancelledTrend} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bookings Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TrendLineChart bookings={bookings} period={dashboardPeriod} cursor={dashboardCursor} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <DonutChart bookings={bookings} period={dashboardPeriod} cursor={dashboardCursor} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Recent Bookings</CardTitle>
                      <button
                        type="button"
                        onClick={() => router.push('/admin/schedule')}
                        className="text-[11px] font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
                      >
                        View all &rarr;
                      </button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {recentBookings.length === 0 ? (
                        <p className="py-4 text-center text-sm text-[var(--text-dim)]">No bookings in this period</p>
                      ) : (
                        recentBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 transition-colors hover:bg-[var(--button)]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{b.name}</p>
                              <p className="text-xs text-[var(--text-dim)]">
                                {format(new Date(b.date), 'MMM d')} at {b.time} &middot; {b.service}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ${
                                STATUS_CLASSES[b.status] || ''
                              }`}
                            >
                              {STATUS_LABELS[b.status] || b.status}
                            </span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Weekly Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <DayOfWeekChart data={dayOfWeekData} />
                      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                        {insights.topSvc && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--button)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            Top: {insights.topSvc.name} ({insights.topSvc.count})
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--button)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          Busiest: {insights.busiestDay}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--button)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                          </svg>
                          ~{insights.avgWeek}/wk
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4 md:p-5">
                    <p className="text-sm font-medium text-[var(--text-muted)]">Quick Actions</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/admin/schedule')}
                      className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span>Manage Schedule</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/admin/basic-info')}
                      className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Edit Profile</span>
                    </Button>
                    <span className="text-xs text-[var(--text-dim)]">&middot;</span>
                    <p className="text-xs text-[var(--text-dim)]">
                      {periodStats.total} booking{periodStats.total !== 1 ? 's' : ''} in selected period
                      {periodStats.pending > 0 && `, ${periodStats.pending} pending`}
                    </p>
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
