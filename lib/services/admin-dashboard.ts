import type { Booking } from '@/app/admin/schedule/_components/types';

interface ApiResponse {
  success?: boolean;
  message?: string;
  summary?: DashboardSummary;
}

export interface DashboardSummary {
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
  recentBookings: Booking[];
}

interface FetchDashboardSummaryOptions {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  recentLimit?: number;
  signal?: AbortSignal;
}

async function parseResponse(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return {};
  }
}

export async function fetchAdminDashboardSummary(options: FetchDashboardSummaryOptions): Promise<DashboardSummary> {
  const params = new URLSearchParams({
    from: options.from,
    to: options.to,
    prevFrom: options.prevFrom,
    prevTo: options.prevTo,
  });

  if (typeof options.recentLimit === 'number') {
    params.set('recentLimit', String(options.recentLimit));
  }

  const res = await fetch(`/api/admin/dashboard/summary?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: options.signal,
  });

  const payload = await parseResponse(res);
  if (!res.ok) {
    throw new Error(payload.message || 'Failed to load dashboard summary');
  }

  if (!payload.summary) {
    throw new Error('Dashboard summary missing in response');
  }

  return payload.summary;
}
