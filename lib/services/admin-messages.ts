import type { AdminContactMessageItem } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  messages?: AdminContactMessageItem[];
  unreadCount?: number;
  totalCount?: number;
}

interface UpdateResponse {
  success?: boolean;
  message?: string;
  messageItem?: AdminContactMessageItem;
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function fetchAdminMessages(limit = 100): Promise<AdminContactMessageItem[]> {
  const res = await fetch(`/api/admin/messages?limit=${Math.max(1, limit)}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const data = await parseJson<ApiResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load messages');
  }

  return data.messages || [];
}

export async function fetchAdminMessageSummary(): Promise<{ unreadCount: number; totalCount: number }> {
  const res = await fetch('/api/admin/messages?limit=1', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const data = await parseJson<ApiResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load message summary');
  }

  return {
    unreadCount: Math.max(0, Number(data.unreadCount || 0)),
    totalCount: Math.max(0, Number(data.totalCount || 0)),
  };
}

export async function updateAdminMessageReadState(id: string, isRead: boolean): Promise<boolean> {
  const res = await fetch('/api/admin/messages', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, isRead }),
  });

  const data = await parseJson<UpdateResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update message');
  }

  return true;
}
