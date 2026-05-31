import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import type { PublicReviewItem } from '@/types/content';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function mapReview(row: {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  media: Array<{ src: string; type: 'image' | 'video'; sortOrder: number }>;
}): PublicReviewItem {
  return {
    id: row.id,
    quote: row.quote,
    author: row.author,
    role: row.role || '',
    collection: [...row.media]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({ src: m.src, type: m.type })),
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedLimit = Number.parseInt((url.searchParams.get('limit') || '').trim(), 10);
  const take = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(MAX_LIMIT, requestedLimit))
    : DEFAULT_LIMIT;

  const rows = await db.review.findMany({
    include: {
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return NextResponse.json(
    {
      success: true,
      reviews: rows.map((row) =>
        mapReview({
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
