import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { formatDateUtc, toScheduleBooking } from '@/app/api/admin/bookings/_utils';

const SUMMARY_CACHE_TTL_MS = 15000;
const SUMMARY_CACHE_STALE_MS = 120000;

interface DashboardSummaryPayload {
  range: {
    from: string;
    to: string;
    prevFrom: string;
    prevTo: string;
  };
  current: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  previous: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  dayOfWeek: number[];
  busiestDayIndex: number;
  topService: { name: string; count: number } | null;
  recentBookings: ReturnType<typeof toScheduleBooking>[];
}

interface SummaryCacheEntry {
  summary: DashboardSummaryPayload;
  updatedAt: number;
}

interface SummaryCacheStore {
  entries: Map<string, SummaryCacheEntry>;
  inFlight: Map<string, Promise<SummaryCacheEntry>>;
}

declare global {
  // eslint-disable-next-line no-var
  var __adminDashboardSummaryCache: SummaryCacheStore | undefined;
}

function getSummaryCacheStore(): SummaryCacheStore {
  if (!globalThis.__adminDashboardSummaryCache) {
    globalThis.__adminDashboardSummaryCache = {
      entries: new Map(),
      inFlight: new Map(),
    };
  }
  return globalThis.__adminDashboardSummaryCache;
}

function buildCacheKey(
  fromValue: string,
  toValue: string,
  prevFromValue: string,
  prevToValue: string,
  recentLimit: number,
): string {
  return `${fromValue}|${toValue}|${prevFromValue}|${prevToValue}|${recentLimit}`;
}

function parseDateOnlyToUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStatusMap(rows: Array<{ status: string; _count: { _all: number } }>) {
  const map = { pending: 0, confirmed: 0, cancelled: 0 };
  for (const row of rows) {
    if (row.status === 'pending' || row.status === 'confirmed' || row.status === 'cancelled') {
      map[row.status] = row._count._all;
    }
  }
  return map;
}

function dateToWeekdayIndex(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

async function buildSummary(
  fromDate: Date,
  toDate: Date,
  prevFromDate: Date,
  prevToDate: Date,
  recentLimit: number,
): Promise<DashboardSummaryPayload> {
  const currentDateWhere = { gte: fromDate, lte: toDate };
  const previousDateWhere = { gte: prevFromDate, lte: prevToDate };

  const [
    currentTotal,
    previousTotal,
    currentStatusRows,
    previousStatusRows,
    topServiceRows,
    weekdayRows,
    recentRows,
  ] = await Promise.all([
    db.booking.count({ where: { date: currentDateWhere } }),
    db.booking.count({ where: { date: previousDateWhere } }),
    db.booking.groupBy({
      by: ['status'],
      where: { date: currentDateWhere },
      _count: { _all: true },
    }),
    db.booking.groupBy({
      by: ['status'],
      where: { date: previousDateWhere },
      _count: { _all: true },
    }),
    db.booking.groupBy({
      by: ['service'],
      where: { date: currentDateWhere },
      _count: { _all: true },
      orderBy: { _count: { service: 'desc' } },
      take: 1,
    }),
    db.booking.findMany({
      where: { date: currentDateWhere },
      select: { date: true },
    }),
    db.booking.findMany({
      where: { date: currentDateWhere },
      orderBy: [{ date: 'desc' }, { timeLabel: 'desc' }, { createdAt: 'desc' }],
      take: recentLimit,
    }),
  ]);

  const dayOfWeek = [0, 0, 0, 0, 0, 0, 0];
  for (const row of weekdayRows) {
    dayOfWeek[dateToWeekdayIndex(row.date)]++;
  }

  const busiestDayIndex = dayOfWeek.indexOf(Math.max(...dayOfWeek));
  const currentStatus = toStatusMap(currentStatusRows);
  const previousStatus = toStatusMap(previousStatusRows);
  const topService = topServiceRows[0]
    ? { name: topServiceRows[0].service, count: topServiceRows[0]._count._all }
    : null;

  return {
    range: {
      from: formatDateUtc(fromDate),
      to: formatDateUtc(toDate),
      prevFrom: formatDateUtc(prevFromDate),
      prevTo: formatDateUtc(prevToDate),
    },
    current: {
      total: currentTotal,
      pending: currentStatus.pending,
      confirmed: currentStatus.confirmed,
      cancelled: currentStatus.cancelled,
    },
    previous: {
      total: previousTotal,
      pending: previousStatus.pending,
      confirmed: previousStatus.confirmed,
      cancelled: previousStatus.cancelled,
    },
    dayOfWeek,
    busiestDayIndex,
    topService,
    recentBookings: recentRows.map(toScheduleBooking),
  };
}

async function getOrBuildSummary(
  key: string,
  fromDate: Date,
  toDate: Date,
  prevFromDate: Date,
  prevToDate: Date,
  recentLimit: number,
): Promise<SummaryCacheEntry> {
  const cacheStore = getSummaryCacheStore();
  const existingInFlight = cacheStore.inFlight.get(key);
  if (existingInFlight) {
    return existingInFlight;
  }

  const inFlight = (async () => {
    const summary = await buildSummary(fromDate, toDate, prevFromDate, prevToDate, recentLimit);
    const entry: SummaryCacheEntry = { summary, updatedAt: Date.now() };
    cacheStore.entries.set(key, entry);
    return entry;
  })();

  cacheStore.inFlight.set(key, inFlight);
  try {
    return await inFlight;
  } finally {
    cacheStore.inFlight.delete(key);
  }
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromValue = (url.searchParams.get('from') || '').trim();
  const toValue = (url.searchParams.get('to') || '').trim();
  const prevFromValue = (url.searchParams.get('prevFrom') || '').trim();
  const prevToValue = (url.searchParams.get('prevTo') || '').trim();
  const recentLimitValue = (url.searchParams.get('recentLimit') || '').trim();

  if (!fromValue || !toValue || !prevFromValue || !prevToValue) {
    return NextResponse.json(
      { success: false, message: 'from, to, prevFrom, and prevTo are required' },
      { status: 400 },
    );
  }

  const fromDate = parseDateOnlyToUtc(fromValue);
  const toDate = parseDateOnlyToUtc(toValue);
  const prevFromDate = parseDateOnlyToUtc(prevFromValue);
  const prevToDate = parseDateOnlyToUtc(prevToValue);

  if (!fromDate || !toDate || !prevFromDate || !prevToDate) {
    return NextResponse.json({ success: false, message: 'Invalid date format' }, { status: 400 });
  }

  let recentLimit = 5;
  if (recentLimitValue) {
    const parsed = Number.parseInt(recentLimitValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
      return NextResponse.json(
        { success: false, message: 'recentLimit must be an integer between 1 and 20' },
        { status: 400 },
      );
    }
    recentLimit = parsed;
  }

  const cacheKey = buildCacheKey(fromValue, toValue, prevFromValue, prevToValue, recentLimit);
  const cacheStore = getSummaryCacheStore();
  const cached = cacheStore.entries.get(cacheKey);
  const now = Date.now();

  if (cached) {
    const ageMs = now - cached.updatedAt;

    if (ageMs <= SUMMARY_CACHE_TTL_MS) {
      return NextResponse.json({ success: true, summary: cached.summary, meta: { cache: 'fresh', ageMs } });
    }

    if (ageMs <= SUMMARY_CACHE_STALE_MS) {
      if (!cacheStore.inFlight.has(cacheKey)) {
        void getOrBuildSummary(cacheKey, fromDate, toDate, prevFromDate, prevToDate, recentLimit);
      }
      return NextResponse.json({ success: true, summary: cached.summary, meta: { cache: 'stale', ageMs } });
    }
  }

  const entry = await getOrBuildSummary(cacheKey, fromDate, toDate, prevFromDate, prevToDate, recentLimit);

  return NextResponse.json({
    success: true,
    summary: entry.summary,
    meta: { cache: 'miss', ageMs: 0 },
  });
}
