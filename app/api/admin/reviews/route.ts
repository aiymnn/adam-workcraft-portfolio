import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { PublicReviewItem } from '@/types/content';

interface ReviewPayload {
  quote?: string;
  author?: string;
  role?: string;
  collection?: Array<{ src?: string; type?: 'image' | 'video' }>;
}

type ReviewMediaItem = { src: string; type: 'image' | 'video' };

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCollection(
  value: unknown,
): { ok: true; collection: ReviewMediaItem[] } | { ok: false; message: string } {
  if (value === undefined) return { ok: true, collection: [] };

  if (!Array.isArray(value)) {
    return { ok: false, message: 'Collection must be an array' };
  }

  const collection: ReviewMediaItem[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];

    if (!item || typeof item !== 'object') {
      return { ok: false, message: `Collection item #${index + 1} is invalid` };
    }

    const src = typeof (item as { src?: unknown }).src === 'string'
      ? (item as { src?: string }).src?.trim() || ''
      : '';
    const type = (item as { type?: unknown }).type;

    if (!src) {
      return { ok: false, message: `Collection item #${index + 1} requires a media URL` };
    }

    if (type !== 'image' && type !== 'video') {
      return { ok: false, message: `Collection item #${index + 1} has invalid media type` };
    }

    collection.push({ src, type });
  }

  return { ok: true, collection };
}

function mapReview(row: {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  isActive: boolean;
  media: Array<{ src: string; type: 'image' | 'video'; sortOrder: number }>;
}): PublicReviewItem {
  return {
    id: row.id,
    quote: row.quote,
    author: row.author,
    role: row.role || '',
    isActive: row.isActive,
    collection: [...row.media]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({ src: m.src, type: m.type })),
  };
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.review.findMany({
    include: {
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    reviews: rows.map((row) =>
      mapReview({
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
    const body = (await request.json()) as ReviewPayload;
    const quote = normalizeText(body.quote);
    const author = normalizeText(body.author);
    const role = normalizeText(body.role);
    const normalizedCollection = normalizeCollection(body.collection);

    if (!quote || !author) {
      return NextResponse.json({ success: false, message: 'Author and review are required' }, { status: 400 });
    }

    if (!normalizedCollection.ok) {
      return NextResponse.json({ success: false, message: normalizedCollection.message }, { status: 400 });
    }

    const created = await db.review.create({
      data: {
        quote,
        author,
        role: role || null,
        media: {
          create: normalizedCollection.collection.map((item, index) => ({
            src: item.src,
            type: item.type,
            sortOrder: index,
          })),
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
        review: mapReview({
          ...created,
          media: created.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
        }),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
