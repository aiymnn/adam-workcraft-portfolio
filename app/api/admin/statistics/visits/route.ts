import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function parseDateValue(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parsePositiveInt(url.searchParams.get('page'), DEFAULT_PAGE);
  const pageSize = Math.min(parsePositiveInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  const browser = (url.searchParams.get('browser') || '').trim();
  const deviceType = (url.searchParams.get('deviceType') || '').trim();
  const search = (url.searchParams.get('search') || '').trim();

  const from = parseDateValue(url.searchParams.get('from'));
  const to = parseDateValue(url.searchParams.get('to'));

  if (url.searchParams.get('from') && !from) {
    return NextResponse.json({ success: false, message: 'Invalid from value' }, { status: 400 });
  }

  if (url.searchParams.get('to') && !to) {
    return NextResponse.json({ success: false, message: 'Invalid to value' }, { status: 400 });
  }

  const where = {
    ...(browser ? { browser } : {}),
    ...(deviceType ? { deviceType } : {}),
    ...(from || to
      ? {
        visitedAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
      : {}),
    ...(search
      ? {
        OR: [
          { path: { contains: search, mode: 'insensitive' as const } },
          { browser: { contains: search, mode: 'insensitive' as const } },
          { os: { contains: search, mode: 'insensitive' as const } },
          { deviceType: { contains: search, mode: 'insensitive' as const } },
          { referrer: { contains: search, mode: 'insensitive' as const } },
          { userAgent: { contains: search, mode: 'insensitive' as const } },
        ],
      }
      : {}),
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [rows, total, todayCount, topBrowsers, topPages, topDevices] = await Promise.all([
    db.pageVisit.findMany({
      where,
      orderBy: { visitedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.pageVisit.count({ where }),
    db.pageVisit.count({ where: { visitedAt: { gte: todayStart } } }),
    db.pageVisit.groupBy({
      by: ['browser'],
      where,
      _count: { _all: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 5,
    }),
    db.pageVisit.groupBy({
      by: ['path'],
      where,
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 5,
    }),
    db.pageVisit.groupBy({
      by: ['deviceType'],
      where,
      _count: { _all: true },
      orderBy: { _count: { deviceType: 'desc' } },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    success: true,
    visits: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    summary: {
      total,
      today: todayCount,
      topBrowsers: topBrowsers.map((item) => ({ label: item.browser, count: item._count._all })),
      topPages: topPages.map((item) => ({ label: item.path, count: item._count._all })),
      topDevices: topDevices.map((item) => ({ label: item.deviceType, count: item._count._all })),
    },
  });
}
