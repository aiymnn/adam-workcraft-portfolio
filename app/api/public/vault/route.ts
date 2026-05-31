import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import type { PublicVaultCollection } from '@/types/content';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedLimit = Number.parseInt((url.searchParams.get('limit') || '').trim(), 10);
  const take = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, requestedLimit))
    : DEFAULT_LIMIT;

  const rows = await db.vaultCollection.findMany({
    include: {
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    take,
  });

  return NextResponse.json(
    {
      success: true,
      collections: rows.map((row) =>
        mapVaultCollection({
          ...row,
          media: row.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
        }),
      ),
    },
    {
      headers: {
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
