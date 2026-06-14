import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { PublicVaultCollection } from '@/types/content';

interface VaultPayload {
  title?: string;
  category?: string;
  media?: string[];
  isVideo?: boolean;
  videos?: string[];
  columnSpan?: number;
  rowSpan?: number;
  order?: number;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeUrlList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapVaultCollection(row: {
  id: string;
  title: string;
  category: string;
  thumb: string;
  isVideo: boolean;
  columnSpan: number;
  rowSpan: number;
  sortOrder: number;
  media: Array<{ src: string; type: 'image' | 'video'; sortOrder: number }>;
}): PublicVaultCollection {
  const sortedMedia = [...row.media].sort((a, b) => a.sortOrder - b.sortOrder);
  const images = sortedMedia.filter((m) => m.type === 'image').map((m) => m.src);
  const videos = sortedMedia.filter((m) => m.type === 'video').map((m) => m.src);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    thumb: row.thumb,
    media: images,
    isVideo: row.isVideo,
    videos,
    columnSpan: row.columnSpan,
    rowSpan: row.rowSpan,
    order: row.sortOrder,
  };
}

function generateVaultCode(): string {
  return `VC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.vaultCollection.findMany({
    include: {
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({
    success: true,
    collections: rows.map((row) =>
      mapVaultCollection({
        ...row,
        media: row.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
      }),
    ),
  });
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as VaultPayload;

    const title = normalizeText(body.title);
    const category = normalizeText(body.category);
    const imageMedia = normalizeUrlList(body.media);
    const videoMedia = normalizeUrlList(body.videos);
    const isVideo = Boolean(body.isVideo);
    const columnSpan = Number.isFinite(body.columnSpan) ? Math.min(3, Math.max(1, Number(body.columnSpan))) : 1;
    const rowSpan = Number.isFinite(body.rowSpan) ? Math.min(2, Math.max(1, Number(body.rowSpan))) : 1;

    if (!title) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ success: false, message: 'Category is required' }, { status: 400 });
    }

    if (isVideo && videoMedia.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one video is required for video collections' }, { status: 400 });
    }

    if (!isVideo && imageMedia.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one image is required for image collections' }, { status: 400 });
    }

    if (category !== 'Photography' && category !== 'Videography') {
      return NextResponse.json({ success: false, message: 'Invalid category. Must be Photography or Videography.' }, { status: 400 });
    }

    const fallbackThumb = imageMedia[0] || videoMedia[0] || '';

    const created = await db.vaultCollection.create({
      data: {
        title,
        category,
        thumb: fallbackThumb,
        code: generateVaultCode(),
        isVideo,
        columnSpan,
        rowSpan,
        sortOrder: Number.isFinite(body.order) ? Math.max(0, Number(body.order)) : 0,
        media: {
          create: [
            ...imageMedia.map((src, index) => ({ src, type: 'image' as const, sortOrder: index })),
            ...videoMedia.map((src, index) => ({ src, type: 'video' as const, sortOrder: imageMedia.length + index })),
          ],
        },
      },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        collection: mapVaultCollection({
          ...created,
          media: created.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create vault collection', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
