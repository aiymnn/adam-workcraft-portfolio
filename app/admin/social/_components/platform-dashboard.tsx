'use client';

import { memo, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDownIcon, TrendingUpIcon, TrendingDownIcon } from '@/components/shared/icons';
import NumberFlow from '@number-flow/react';
import type { PlatformDummyData } from '@/types/social';
import type { SocialPlatformId } from '@/lib/constants';

function formatCompact(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

const AMBER = '#f59e0b';

const PERIODS = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
] as const;

type Period = 'week' | 'month' | 'year';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LABEL_STYLE: Record<string, { icon: React.ReactNode; accent: string }> = {
  Followers: {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    accent: 'bg-blue-900/40 text-blue-400',
  },
  'Total Views': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    accent: 'bg-purple-900/40 text-purple-400',
  },
  'Total Impressions': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    accent: 'bg-purple-900/40 text-purple-400',
  },
  'Profile Reach': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    accent: 'bg-purple-900/40 text-purple-400',
  },
  'Total Chats': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
    accent: 'bg-emerald-900/40 text-emerald-400',
  },
  'Messages Sent': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
    accent: 'bg-teal-900/40 text-teal-400',
  },
  'Broadcast Lists': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a3.04 3.04 0 01-3.157-.019L4.42 14.93A2.25 2.25 0 013 13.047V11.25m13.5-4.5A2.25 2.25 0 0118.75 9v2.25m0 0a2.25 2.25 0 001.35 2.045l4.5 2.25c.69.345.9 1.2.45 1.845a2.733 2.733 0 01-2.26 1.16H18.75" /></svg>,
    accent: 'bg-violet-900/40 text-violet-400',
  },
  'Videos Posted': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
    accent: 'bg-indigo-900/40 text-indigo-400',
  },
  Posts: {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    accent: 'bg-indigo-900/40 text-indigo-400',
  },
  Threads: {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>,
    accent: 'bg-indigo-900/40 text-indigo-400',
  },
  'Response Rate': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    accent: 'bg-cyan-900/40 text-cyan-400',
  },
  'Engagement Rate': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>,
    accent: 'bg-amber-900/40 text-amber-300',
  },
  'Avg. Watch Time': {
    icon: <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    accent: 'bg-orange-900/40 text-orange-400',
  },
};

const StatNumber = memo(function StatNumber({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setV(value));
    return () => cancelAnimationFrame(t);
  }, [value]);
  const isTime = label === 'Avg. Watch Time';
  return (
    <div className="overflow-hidden">
      <NumberFlow
        value={v}
        format={{ notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }}
        prefix={isTime ? '0:' : ''}
        suffix={isTime ? '' : suffix}
        transformTiming={{ duration: 400, easing: 'ease-out' }}
        className="text-xl font-semibold text-[var(--text)]"
      />
    </div>
  );
});

const StatsCards = memo(function StatsCards({ data }: { data: PlatformDummyData }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {data.stats.map((card) => {
        const trend = card.sub.startsWith('+') ? 'up' : card.sub.startsWith('-') ? 'down' : null;
        const style = LABEL_STYLE[card.label];
        return (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style?.accent || 'bg-[var(--button)] text-[var(--text-muted)]'}`}>
                  {style?.icon || (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">{card.label}</p>
                  <div className="mt-0.5">
                    <StatNumber
                      value={card.rawValue}
                      suffix={card.value.endsWith('%') ? '%' : ''}
                      label={card.label}
                    />
                  </div>
                  <p className={`mt-0.5 flex items-center gap-0.5 text-[10px] ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
                    {trend === 'up' && <TrendingUpIcon className="size-3" />}
                    {trend === 'down' && <TrendingDownIcon className="size-3" />}
                    {card.sub}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

const GrowthChart = memo(function GrowthChart({ data, platformId, period, cursor, onCursorChange }: { data: PlatformDummyData; platformId: SocialPlatformId; period: Period; cursor: Date; onCursorChange: (d: Date) => void }) {
  const [hovered, setHovered] = useState<{ label: string; value: number; cx: number; cy: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const growthMap = useMemo(() => new Map(data.growth.map(p => [p.date, p.value])), [data.growth]);
  const title = platformId === 'whatsapp' ? 'Messages Over Time' : 'Follower Growth';

  const { sliced, labels, navLabel } = useMemo(() => {
    if (period === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay() + 1);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
      const vals = days.map((day) => {
        const ds = day.toISOString().slice(0, 10);
        return growthMap.get(ds) || 0;
      });
      const labs = days.map((d) => d.toLocaleDateString('en', { weekday: 'short' }));
      return { sliced: vals, labels: labs, navLabel: `${days[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en', { month: 'short', day: 'numeric' })}` };
    }
    if (period === 'month') {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const vals = Array.from({ length: daysInMonth }, (_, i) => {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        return growthMap.get(ds) || 0;
      });
      const step = Math.max(1, Math.floor(daysInMonth / 10));
      const labs = Array.from({ length: daysInMonth }, (_, i) => (i % step === 0 ? `${i + 1}` : ''));
      return { sliced: vals, labels: labs, navLabel: cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' }) };
    }
    const year = cursor.getFullYear();
    const vals = Array.from({ length: 12 }, (_, m) => {
      const ds = `${year}-${String(m + 1).padStart(2, '0')}-01`;
      return growthMap.get(ds) || 0;
    });
    return { sliced: vals, labels: MONTHS, navLabel: `${year}` };
  }, [period, cursor, growthMap]);

  const trend = useMemo(() => {
    if (sliced.length < 2) return 0;
    if (period === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay() + 1);
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);
      let cur = 0, prev = 0;
      for (let i = 0; i < 7; i++) {
        const d1 = new Date(start); d1.setDate(d1.getDate() + i);
        const d2 = new Date(prevStart); d2.setDate(d2.getDate() + i);
        cur += growthMap.get(d1.toISOString().slice(0, 10)) || 0;
        prev += growthMap.get(d2.toISOString().slice(0, 10)) || 0;
      }
      return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
    }
    if (period === 'month') {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      let cur = 0, prev = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        cur += growthMap.get(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`) || 0;
      }
      for (let d = 1; d <= prevDays; d++) {
        prev += growthMap.get(`${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`) || 0;
      }
      return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
    }
    const year = cursor.getFullYear();
    let cur = 0, prev = 0;
    for (let m = 0; m < 12; m++) {
      cur += growthMap.get(`${year}-${String(m + 1).padStart(2, '0')}-01`) || 0;
      prev += growthMap.get(`${year - 1}-${String(m + 1).padStart(2, '0')}-01`) || 0;
    }
    return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
  }, [period, cursor, growthMap, sliced]);

  const max = Math.max(...sliced, 1);
  const ptCount = sliced.length;
  const padL = 4;
  const padR = 4;
  const padT = 6;
  const padB = 6;
  const svgW = 300;
  const svgH = 70;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const stepX = ptCount > 1 ? chartW / (ptCount - 1) : chartW;
  const minVal = Math.min(...sliced, 0);
  const range = max - minVal || 1;

  const points = sliced
    .map((v, i) => {
      const x = padL + i * stepX;
      const y = padT + chartH - ((v - minVal) / range) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${svgH - padB} ${points} ${padL + (ptCount - 1) * stepX},${svgH - padB}`;

  const onPrev = useCallback(() => {
    const d = new Date(cursor);
    if (period === 'week') d.setDate(d.getDate() - 7);
    else if (period === 'month') d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    onCursorChange(d);
  }, [period, cursor, onCursorChange]);

  const onNext = useCallback(() => {
    const d = new Date(cursor);
    if (period === 'week') d.setDate(d.getDate() + 7);
    else if (period === 'month') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    onCursorChange(d);
  }, [period, cursor, onCursorChange]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const ratio = relX / rect.width;
      const i = Math.round(ratio * (ptCount - 1));
      const idx = Math.max(0, Math.min(ptCount - 1, i));
      const x = (idx / (ptCount - 1)) * chartW + padL;
      const y = padT + chartH - ((sliced[idx] - minVal) / range) * chartH;
      const cx = (x / svgW) * rect.width;
      const cy = (y / svgH) * rect.height;
      const tipLabel = period === 'month' ? `${idx + 1}` : labels[idx];
      setHovered({ label: tipLabel || '', value: sliced[idx], cx, cy });
    },
    [sliced, labels, minVal, range, ptCount, chartW, chartH, period],
  );

  const handlePointerLeave = useCallback(() => setHovered(null), []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-[var(--text)]">{title}</CardTitle>
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-[var(--text-dim)]'}`}>
            {trend !== 0 && (
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {trend > 0
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.95 11.95 0 014.306 6.43l.536 2.929m0 0l-5.94 2.28m5.94-2.28l2.28-5.941" />
              }
            </svg>
            )}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div ref={chartRef}>
          <div className="flex items-center justify-center gap-4 pb-1">
            <button
              type="button"
              onClick={onPrev}
              className="flex size-6 items-center justify-center rounded text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
            >
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-[11px] font-medium text-[var(--text)]">{navLabel}</span>
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
          <div className="relative">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
              <defs>
                <linearGradient id={`growthArea-${platformId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AMBER} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill={`url(#growthArea-${platformId})`} />
              <polyline points={points} fill="none" stroke={AMBER} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {hovered && chartRef.current && (
                <circle
                  cx={(hovered.cx / chartRef.current.getBoundingClientRect().width) * svgW}
                  cy={(hovered.cy / chartRef.current.getBoundingClientRect().height) * svgH}
                  r={4}
                  fill={AMBER}
                  stroke="var(--bg-end)"
                  strokeWidth={2}
                  style={{ filter: `drop-shadow(0 0 4px ${AMBER}66)` }}
                />
              )}
            </svg>
            {hovered && chartRef.current && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                style={{ left: hovered.cx, top: hovered.cy - 8 }}
              >
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] px-2.5 py-1.5 shadow-xl">
                  <p className="text-center text-[10px] font-medium text-[var(--text-dim)]">{hovered.label}</p>
                  <p className="text-center text-sm font-bold text-[var(--text)]">{formatCompact(hovered.value)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 flex justify-between px-0.5 text-[10px] text-[var(--text-dim)]">
          {labels.map((l, i) => (
            <span key={i} className="text-center" style={{ width: `${100 / ptCount}%` }}>
              {l}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const BarChart = memo(function BarChart({ data, period, cursor }: { data: PlatformDummyData; period: Period; cursor: Date }) {
  const growthMap = useMemo(() => new Map(data.growth.map(p => [p.date, p.value])), [data.growth]);
  const { barData, barLabels, title } = useMemo(() => {
    if (period === 'week') {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay() + 1);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
      const vals = days.map((day) => {
        const ds = day.toISOString().slice(0, 10);
        return growthMap.get(ds) || 0;
      });
      return { barData: vals, barLabels: DAYS, title: `Weekly ${data.barLabel}` };
    }
    if (period === 'month') {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const weeks = [0, 0, 0, 0];
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const weekIdx = Math.min(3, Math.floor((d - 1) / 7));
        weeks[weekIdx] += growthMap.get(ds) || 0;
      }
      return { barData: weeks, barLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], title: cursor.toLocaleDateString('en', { month: 'long', year: 'numeric' }) + ' ' + data.barLabel };
    }
    const year = cursor.getFullYear();
    const vals = Array.from({ length: 12 }, (_, m) => {
      const ds = `${year}-${String(m + 1).padStart(2, '0')}-01`;
      return growthMap.get(ds) || 0;
    });
    return { barData: vals, barLabels: MONTHS, title: `${year} ${data.barLabel}` };
  }, [period, cursor, growthMap]);

  const max = Math.max(...barData, 1);
  const peakIdx = barData.indexOf(max);

  return (
    <Card className="flex flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-[var(--text)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-1.5 px-4 pb-4 pt-0">
        <div className="flex h-full flex-col justify-center gap-1.5">
          {barData.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-right text-[10px] font-medium text-[var(--text-dim)] sm:w-10 sm:text-[11px]">
                {barLabels[i]}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-[var(--border)]" style={{ height: '18px' }}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    i === peakIdx ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-[var(--button-hover)]'
                  }`}
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-[10px] font-medium text-[var(--text)] sm:w-8 sm:text-xs">
                {v}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const TopPostList = memo(function TopPostList({ data }: { data: PlatformDummyData }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-[var(--text)]">{data.topPostsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4 pt-0">
        <div className="flex h-full flex-col justify-center gap-2">
          {data.topPosts.map((post, i) => (
            <div key={post.title} className="flex items-center justify-between rounded-md border border-[var(--border)] px-2.5 py-1.5 sm:px-3 sm:py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[var(--button)] text-[10px] font-bold text-[var(--text-dim)]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text)] leading-tight">{post.title}</p>
                  <p className="text-[10px] text-[var(--text-dim)] leading-tight">{post.date} · {post.metric}</p>
                </div>
              </div>
              <div className="shrink-0 pl-1.5 text-right sm:pl-2">
                <p className="text-xs font-semibold text-[var(--text)]">{formatCompact(post.likes)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

const WeekSelector = memo(function WeekSelector({ cursor, onChange }: { cursor: Date; onChange: (d: Date) => void }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const weeks = useMemo(() => {
    // Align with bar-chart monthly bucketing: days 1-7 → Week 1, 8-14 → Week 2, etc.
    const numWeeks = Math.min(4, Math.ceil(daysInMonth / 7));
    return Array.from({ length: numWeeks }, (_, i) => {
      // Midpoint of each bucket so the growth chart's Mon-Sun snap shows the right calendar week
      const day = Math.min(i * 7 + 4, daysInMonth);
      const mid = new Date(year, month, day);
      return { label: `Week ${i + 1}`, mid };
    });
  }, [year, month, daysInMonth]);

  const activeIdx = weeks.findIndex((w) => {
    const day = cursor.getDate();
    const start = weeks.indexOf(w) * 7 + 1;
    const end = Math.min(start + 6, daysInMonth);
    return day >= start && day <= end;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {weeks.map((w, i) => (
        <button
          key={w.label}
          type="button"
          onClick={() => onChange(new Date(w.mid))}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            i === activeIdx
              ? 'bg-[var(--button-hover)] text-[var(--text)]'
              : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text)]'
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
});

const MonthYearSelector = memo(function MonthYearSelector({ cursor, onChange }: { cursor: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const displayYear = cursor.getFullYear();
  const displayMonth = cursor.getMonth();

  const prevYear = useCallback(() => {
    const d = new Date(cursor);
    d.setFullYear(d.getFullYear() - 1);
    onChange(d);
  }, [cursor, onChange]);

  const nextYear = useCallback(() => {
    const d = new Date(cursor);
    d.setFullYear(d.getFullYear() + 1);
    onChange(d);
  }, [cursor, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--button)] hover:border-[var(--text-muted)]">
        {MONTHS[displayMonth]} {displayYear}
        <ChevronDownIcon className="size-3.5 text-[var(--text-dim)]" />
      </PopoverTrigger>
      <PopoverContent className="w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] p-2 shadow-xl" align="start">
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => { const d = new Date(cursor); d.setMonth(i); onChange(d); setOpen(false); }}
              className={`relative rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                i === displayMonth
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text)]'
              }`}
            >
              {i === displayMonth && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">✓</span>
              )}
              {m}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
          <button
            type="button"
            onClick={prevYear}
            className="flex size-6 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-[var(--text)]">{displayYear}</span>
          <button
            type="button"
            onClick={nextYear}
            className="flex size-6 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

const YearSelector = memo(function YearSelector({ cursor, onChange }: { cursor: Date; onChange: (d: Date) => void }) {
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y];
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => {
            const d = new Date(cursor);
            d.setFullYear(y);
            onChange(d);
          }}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            y === cursor.getFullYear()
              ? 'bg-[var(--button-hover)] text-[var(--text)]'
              : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text)]'
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
});

interface PlatformDashboardProps {
  data: PlatformDummyData;
  platformId: SocialPlatformId;
}

export default function PlatformDashboard({ data, platformId }: PlatformDashboardProps) {
  const now = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>('month');
  const [cursor, setCursor] = useState(now);

  return (
    <div className="space-y-4">
      <StatsCards data={data} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 rounded-lg border border-[var(--border)] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => { setPeriod(p.key); setCursor(now); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="border-l border-[var(--border)] pl-2">
          {period === 'week' && <WeekSelector cursor={cursor} onChange={setCursor} />}
          {period === 'month' && <MonthYearSelector cursor={cursor} onChange={setCursor} />}
          {period === 'year' && <YearSelector cursor={cursor} onChange={setCursor} />}
        </div>
      </div>
      <GrowthChart data={data} platformId={platformId} period={period} cursor={cursor} onCursorChange={setCursor} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart data={data} period={period} cursor={cursor} />
        <TopPostList data={data} />
      </div>
    </div>
  );
}
