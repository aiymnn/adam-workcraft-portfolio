import type { StoryLoopImagePublicItem } from '@/types/content';
import {
  DEFAULT_STORY_LOOP_IMAGES_SETTINGS,
  type StoryLoopImagesSettings,
} from '@/lib/story-loop-logos';

interface ApiResponse {
  success?: boolean;
  message?: string;
  logo?: StoryLoopImagePublicItem;
  logos?: StoryLoopImagePublicItem[];
  settings?: StoryLoopImagesSettings;
}

interface StoryLoopImagesSettingsPayload {
  randomizeOrder: boolean;
}

interface SaveStoryLoopImagePayload {
  name?: string;
  src: string;
  order?: number;
}

type SaveStoryLoopImageInput = Partial<SaveStoryLoopImagePayload> & {
  src: string;
};

function normalizePayload(payload: SaveStoryLoopImageInput): SaveStoryLoopImagePayload {
  const next: SaveStoryLoopImagePayload = {
    src: payload.src,
  };

  if (payload.name !== undefined) next.name = payload.name;
  if (payload.order !== undefined && Number.isFinite(payload.order)) {
    next.order = Number(payload.order);
  }

  return next;
}

function normalizePartialPayload(payload: Partial<SaveStoryLoopImageInput>): Partial<SaveStoryLoopImagePayload> {
  const next: Partial<SaveStoryLoopImagePayload> = {};

  if (payload.name !== undefined) next.name = payload.name;
  if (payload.src !== undefined) next.src = payload.src;
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

export async function fetchAdminStoryLoopImages(): Promise<StoryLoopImagePublicItem[]> {
  const res = await fetch('/api/admin/story-loop-logos', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.logos || [];
}

export async function createAdminStoryLoopImage(payload: SaveStoryLoopImageInput): Promise<StoryLoopImagePublicItem> {
  const res = await fetch('/api/admin/story-loop-logos', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizePayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.logo) throw new Error('Image missing in response');
  return data.logo;
}

export async function updateAdminStoryLoopImage(id: string, payload: Partial<SaveStoryLoopImageInput>): Promise<StoryLoopImagePublicItem> {
  const res = await fetch(`/api/admin/story-loop-logos/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(normalizePartialPayload(payload)),
  });
  const data = await assertOk(res);
  if (!data.logo) throw new Error('Image missing in response');
  return data.logo;
}

export async function deleteAdminStoryLoopImage(id: string): Promise<void> {
  const res = await fetch(`/api/admin/story-loop-logos/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  await assertOk(res);
}

export async function fetchAdminStoryLoopImagesSettings(): Promise<StoryLoopImagesSettings> {
  const res = await fetch('/api/admin/story-loop-logos/settings', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.settings || { ...DEFAULT_STORY_LOOP_IMAGES_SETTINGS };
}

export async function updateAdminStoryLoopImagesSettings(
  payload: StoryLoopImagesSettingsPayload,
): Promise<StoryLoopImagesSettings> {
  const res = await fetch('/api/admin/story-loop-logos/settings', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await assertOk(res);
  return data.settings || { ...DEFAULT_STORY_LOOP_IMAGES_SETTINGS };
}
