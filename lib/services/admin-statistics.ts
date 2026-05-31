export interface VisitItem {
  id: string;
  path: string;
  sessionId: string | null;
  referrer: string | null;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
  language: string | null;
  country: string | null;
  ipHash: string | null;
  visitedAt: string;
}

export interface VisitSummaryBucket {
  label: string;
  count: number;
}

export interface VisitSummary {
  total: number;
  today: number;
  topBrowsers: VisitSummaryBucket[];
  topPages: VisitSummaryBucket[];
  topDevices: VisitSummaryBucket[];
}

export interface VisitPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface VisitQueryOptions {
  page?: number;
  pageSize?: number;
  browser?: string;
  deviceType?: string;
  search?: string;
  from?: string;
  to?: string;
  signal?: AbortSignal;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  visits?: VisitItem[];
  pagination?: VisitPagination;
  summary?: VisitSummary;
}

async function parseResponse(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return {};
  }
}

export async function fetchAdminVisits(options: VisitQueryOptions = {}) {
  const params = new URLSearchParams();
  if (typeof options.page === 'number') params.set('page', String(options.page));
  if (typeof options.pageSize === 'number') params.set('pageSize', String(options.pageSize));
  if (options.browser) params.set('browser', options.browser);
  if (options.deviceType) params.set('deviceType', options.deviceType);
  if (options.search) params.set('search', options.search);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);

  const query = params.toString();
  const endpoint = query ? `/api/admin/statistics/visits?${query}` : '/api/admin/statistics/visits';

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: options.signal,
  });

  const payload = await parseResponse(res);
  if (!res.ok) {
    throw new Error(payload.message || 'Failed to load visit analytics');
  }

  return {
    visits: payload.visits || [],
    pagination: payload.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    summary: payload.summary || {
      total: 0,
      today: 0,
      topBrowsers: [],
      topPages: [],
      topDevices: [],
    },
  };
}
