'use client';

import { useEffect, useRef, useMemo, useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, getDay, getDaysInMonth, addMonths, subMonths, addYears, subYears, addWeeks, subWeeks } from 'date-fns';
import NumberFlow from '@number-flow/react';
import type { Booking } from '@/app/admin/schedule/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

const STORAGE_KEY = 'admin_bookings';

function loadBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {}
  return [];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-300',
  confirmed: 'bg-emerald-900/40 text-emerald-300',
  cancelled: 'bg-red-900/40 text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

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
}

const StatCard = memo(function StatCard({ label, value, icon, accent, href }: StatCardProps) {
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
          <div>
            <p className="text-xs font-medium text-[var(--text-dim)]">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
              <NumberFlow value={value} transformTiming={{ duration: 600, easing: 'ease-out' }} />
            </p>
          </div>
        </div>
      </CardContent>
    </button>
  );
});

function TrendLineChart({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>('week');
  const [cursor, setCursor] = useState(now);
  const [hovered, setHovered] = useState<{ label: string; value: number; cx: number; cy: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const { data, labels, navLabel } = useMemo(() => {
    if (period === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      const end = endOfWeek(cursor, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });
      const d = days.map((day) => {
        const ds = format(day, 'yyyy-MM-dd');
        return bookings.filter((b) => b.date === ds).length;
      });
      const labs = days.map((day) => format(day, 'EEE'));
      return { data: d, labels: labs, navLabel: format(start, 'MMM d, yyyy') };
    }
    if (period === 'month') {
      const count = getDaysInMonth(cursor);
      const d = Array.from({ length: count }, (_, i) => {
        const ds = format(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1), 'yyyy-MM-dd');
        return bookings.filter((b) => b.date === ds).length;
      });
      const step = Math.max(1, Math.floor(count / 10));
      const labs = Array.from({ length: count }, (_, i) => (i % step === 0 ? `${i + 1}` : ''));
      return { data: d, labels: labs, navLabel: format(cursor, 'MMMM yyyy') };
    }
    const d = Array.from({ length: 12 }, (_, i) => {
      const m = i.toString().padStart(2, '0');
      return bookings.filter((b) => b.date.startsWith(`${cursor.getFullYear()}-${m}`)).length;
    });
    return { data: d, labels: MONTH_NAMES, navLabel: `${cursor.getFullYear()}` };
  }, [period, cursor, bookings]);

  const onPrev = useCallback(() => {
    setCursor((c) => (period === 'week' ? subWeeks(c, 1) : period === 'month' ? subMonths(c, 1) : subYears(c, 1)));
  }, [period]);

  const onNext = useCallback(() => {
    setCursor((c) => (period === 'week' ? addWeeks(c, 1) : period === 'month' ? addMonths(c, 1) : addYears(c, 1)));
  }, [period]);

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
      setHovered({ label: labels[idx], value: data[idx], cx: x, cy: (cy / svgH) * rect.height });
    },
    [data, labels, max, ptCount, chartW, chartH],
  );

  const handlePointerLeave = useCallback(() => setHovered(null), []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 rounded-lg border border-[var(--border)] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => { setPeriod(p.key); setCursor(now); }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                period === p.key
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/schedule')}
          className="text-[11px] font-medium text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
        >
          View all &rarr;
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex size-6 items-center justify-center rounded text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-xs font-medium text-[var(--text-muted)]">{navLabel}</span>
        <button
          type="button"
          onClick={onNext}
          className="flex size-6 items-center justify-center rounded text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
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
                stroke={hovered && Math.round((i / (ptCount - 1)) * chartW) === Math.round(hovered.cx / (chartRef.current?.getBoundingClientRect().width || 1) * svgW) ? '#1c1917' : 'none'}
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

function DonutChart({ bookings }: { bookings: Booking[] }) {
  const segments = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    return [
      { status: 'confirmed', count: confirmed, color: '#10b981' },
      { status: 'pending', count: pending, color: '#f59e0b' },
      { status: 'cancelled', count: cancelled, color: '#ef4444' },
    ].filter((s) => s.count > 0);
  }, [bookings]);

  const [hoveredSeg, setHoveredSeg] = useState<string | null>(null);
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  if (total === 0) return <p className="py-8 text-center text-sm text-[var(--text-dim)]">No data</p>;

  const r = 58;
  const circ = 2 * Math.PI * r;
  const viewSize = 160;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 py-2 sm:flex-row sm:justify-center sm:gap-8">
      <svg width="100%" height="100%" viewBox={`0 0 ${viewSize} ${viewSize}`} className="max-w-[180px]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#292524" strokeWidth={16} />
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
              strokeWidth={isHovered ? 20 : 16}
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
        <circle cx={cx} cy={cy} r={30} fill="#1c1917" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#a8a29e" fontSize={10} fontWeight={500}>
          Total
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#f5f5f4" fontSize={20} fontWeight={700}>
          {total}
        </text>
      </svg>
      <div className="flex flex-row flex-wrap justify-center gap-2 sm:flex-col">
        {segments.map((seg) => {
          const pct = Math.round((seg.count / total) * 100);
          const isHovered = hoveredSeg === seg.status;
          return (
            <button
              key={seg.status}
              type="button"
              className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-xs transition-all ${
                isHovered
                  ? 'border-[var(--button-hover)] bg-[var(--button)]'
                  : 'border-transparent hover:bg-[var(--button)]'
              }`}
              onPointerEnter={() => setHoveredSeg(seg.status)}
              onPointerLeave={() => setHoveredSeg(null)}
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: seg.color }} />
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

function DayOfWeekChart({ bookings }: { bookings: Booking[] }) {
  const data = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const b of bookings) {
      const d = getDay(new Date(b.date));
      const idx = d === 0 ? 6 : d - 1;
      counts[idx]++;
    }
    return counts;
  }, [bookings]);

  const max = Math.max(...data, 1);
  const busiestIdx = data.indexOf(Math.max(...data));

  return (
    <div className="space-y-2">
      {data.map((count, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-8 text-right text-[11px] font-medium text-[var(--text-dim)]">{DAY_SHORT[i]}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className={`h-5 rounded-full transition-all duration-500 ${
                i === busiestIdx
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-[var(--button-hover)]'
              }`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-xs font-medium text-[var(--text)]">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('admin_auth');
      if (authed !== 'true') {
        localStorage.setItem('admin_last_page', '/admin/dashboard');
        router.replace('/admin/login');
        return;
      }
    }
    setBookings(loadBookings());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
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

  const handleSignOut = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    return { total: bookings.length, pending, confirmed, cancelled };
  }, [bookings]);

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)).slice(0, 5),
    [bookings],
  );

  const dayOfWeekData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const b of bookings) {
      const d = getDay(new Date(b.date));
      const idx = d === 0 ? 6 : d - 1;
      counts[idx]++;
    }
    return counts;
  }, [bookings]);

  const insights = useMemo(() => {
    const svcMap = new Map<string, number>();
    for (const b of bookings) svcMap.set(b.service, (svcMap.get(b.service) || 0) + 1);
    const topSvc = [...svcMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const busiestIdx = dayOfWeekData.indexOf(Math.max(...dayOfWeekData));
    const firstDate = [...bookings].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
    const weeksSince = firstDate ? Math.max(1, Math.ceil((now.getTime() - new Date(firstDate).getTime()) / (7 * 86400000))) : 1;
    const avgWeek = bookings.length > 0 ? (bookings.length / weeksSince).toFixed(1) : '0';
    return { topSvc: topSvc ? { name: topSvc[0], count: topSvc[1] } : null, busiestDay: DAY_SHORT[busiestIdx], avgWeek };
  }, [bookings, dayOfWeekData, now]);

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
              title={`${getGreeting()}, Adam`}
              description={format(now, 'EEEE, MMMM d, yyyy — h:mm a')}
              actions={
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
              }
            />

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              <StatCard label="Total Bookings" value={stats.total} icon="calendar" accent="bg-[var(--button)] text-[var(--text-muted)]" href="/admin/schedule" />
              <StatCard label="Pending" value={stats.pending} icon="pending" accent="bg-amber-900/40 text-amber-300" href="/admin/schedule" />
              <StatCard label="Confirmed" value={stats.confirmed} icon="check" accent="bg-emerald-900/40 text-emerald-300" href="/admin/schedule" />
              <StatCard label="Cancelled" value={stats.cancelled} icon="xmark" accent="bg-red-900/40 text-red-300" href="/admin/schedule" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bookings Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendLineChart bookings={bookings} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart bookings={bookings} />
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
                    <p className="py-4 text-center text-sm text-[var(--text-dim)]">No bookings yet</p>
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
                  <DayOfWeekChart bookings={bookings} />
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
                  {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
                  {stats.pending > 0 && `, ${stats.pending} pending`}
                </p>
              </CardContent>
            </Card>
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
