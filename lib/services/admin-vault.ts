import type { PublicVaultCollection } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  collection?: PublicVaultCollection;
  collections?: PublicVaultCollection[];
}

interface SaveVaultCollectionPayload {
  title: string;
  category: string;
  media: string[];
  isVideo: boolean;
  videos: string[];
  columnSpan: number;
  rowSpan: number;
  order: number;
}

type SaveVaultCollectionInput = Partial<SaveVaultCollectionPayload> & {
  title: string;
  category: string;
  media?: string[];
  videos?: string[];
  isVideo?: boolean;
  columnSpan?: number;
  rowSpan?: number;
  order?: number;
};

function normalizeVaultPayload(payload: SaveVaultCollectionInput): SaveVaultCollectionPayload {
  return {
    title: payload.title,
    category: payload.category,
    media: payload.media ?? [],
    isVideo: Boolean(payload.isVideo),
    videos: payload.videos ?? [],
    columnSpan: Number.isFinite(payload.columnSpan) ? Number(payload.columnSpan) : 1,
    rowSpan: Number.isFinite(payload.rowSpan) ? Number(payload.rowSpan) : 1,
    order: Number.isFinite(payload.order) ? Number(payload.order) : 0,
  };
}

function normalizeVaultPartialPayload(payload: Partial<SaveVaultCollectionInput>): Partial<SaveVaultCollectionPayload> {
  const next: Partial<SaveVaultCollectionPayload> = {};

  if (payload.title !== undefined) next.title = payload.title;
  if (payload.category !== undefined) next.category = payload.category;
  if (payload.media !== undefined) next.media = payload.media;
  if (payload.isVideo !== undefined) next.isVideo = Boolean(payload.isVideo);
  if (payload.videos !== undefined) next.videos = payload.videos;
  if (payload.columnSpan !== undefined) next.columnSpan = Number(payload.columnSpan);
  if (payload.rowSpan !== undefined) next.rowSpan = Number(payload.rowSpan);
  if (payload.order !== undefined) next.order = Number(payload.order);

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

export async function fetchAdminVaultCollections(): Promise<PublicVaultCollection[]> {
  const res = await fetch('/api/admin/vault', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.collections || [];
}

export async function createAdminVaultCollection(payload: SaveVaultCollectionInput): Promise<PublicVaultCollection> {
  const res = await fetch('/api/admin/vault', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizeVaultPayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.collection) throw new Error('Collection missing in response');
  return data.collection;
}

export async function updateAdminVaultCollection(id: string, payload: Partial<SaveVaultCollectionInput>): Promise<PublicVaultCollection> {
  const res = await fetch(`/api/admin/vault/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizeVaultPartialPayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.collection) throw new Error('Collection missing in response');
  return data.collection;
}

export async function deleteAdminVaultCollection(id: string): Promise<void> {
  const res = await fetch(`/api/admin/vault/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  await assertOk(res);
}
