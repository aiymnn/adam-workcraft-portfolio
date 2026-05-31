import type { PublicReviewItem } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  review?: PublicReviewItem;
  reviews?: PublicReviewItem[];
}

interface SaveReviewPayload {
  quote: string;
  author: string;
  role: string;
  collection: Array<{ src: string; type: 'image' | 'video' }>;
}

type SaveReviewInput = Partial<SaveReviewPayload> & {
  quote: string;
  author: string;
  role?: string;
  collection?: Array<{ src?: string; type?: 'image' | 'video' }>;
};

function normalizeMediaCollection(
  collection: SaveReviewInput['collection'],
): SaveReviewPayload['collection'] {
  if (!Array.isArray(collection)) return [];

  const next: SaveReviewPayload['collection'] = [];

  for (const item of collection) {
    if (!item) continue;

    const src = typeof item.src === 'string' ? item.src.trim() : '';
    if (!src) continue;

    next.push({
      src,
      type: item.type === 'video' ? 'video' : 'image',
    });
  }

  return next;
}

function normalizeReviewPayload(payload: SaveReviewInput): SaveReviewPayload {
  return {
    quote: payload.quote,
    author: payload.author,
    role: payload.role ?? '',
    collection: normalizeMediaCollection(payload.collection),
  };
}

function normalizeReviewPartialPayload(payload: Partial<SaveReviewInput>): Partial<SaveReviewPayload> {
  const next: Partial<SaveReviewPayload> = {};

  if (payload.quote !== undefined) next.quote = payload.quote;
  if (payload.author !== undefined) next.author = payload.author;
  if (payload.role !== undefined) next.role = payload.role;
  if (payload.collection !== undefined) next.collection = normalizeMediaCollection(payload.collection);

  return next;
}

async function parseResponse(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return {};
  }
}

async function assertOk(res: Response): Promise<ApiResponse> {
  const payload = await parseResponse(res);
  if (!res.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

export async function fetchAdminReviews(): Promise<PublicReviewItem[]> {
  const res = await fetch('/api/admin/reviews', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.reviews || [];
}

export async function createAdminReview(payload: SaveReviewInput): Promise<PublicReviewItem> {
  const res = await fetch('/api/admin/reviews', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizeReviewPayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.review) throw new Error('Review missing in response');
  return data.review;
}

export async function updateAdminReview(id: string, payload: Partial<SaveReviewInput>): Promise<PublicReviewItem> {
  const res = await fetch(`/api/admin/reviews/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizeReviewPartialPayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.review) throw new Error('Review missing in response');
  return data.review;
}

export async function deleteAdminReview(id: string): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  await assertOk(res);
}
