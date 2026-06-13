import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { deleteGoogleDriveFile } from '@/lib/server/google-drive';
import type { PublicReviewItem } from '@/types/content';

interface ReviewUpdatePayload {
  quote?: string;
  author?: string;
  role?: string;
  isActive?: boolean;
  collection?: Array<{ src?: string; type?: 'image' | 'video' }>;
}

type ReviewMediaItem = { src: string; type: 'image' | 'video' };

function extractDriveFileIdFromProxyUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/media\/([^/?#]+)/i);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as ReviewUpdatePayload;
    const existing = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const quote = body.quote !== undefined ? normalizeText(body.quote) : undefined;
    const author = body.author !== undefined ? normalizeText(body.author) : undefined;
    const role = body.role !== undefined ? normalizeText(body.role) : undefined;
    const normalizedCollection = body.collection !== undefined ? normalizeCollection(body.collection) : null;
    const isActive = body.isActive;

    if (quote !== undefined && !quote) {
      return NextResponse.json({ success: false, message: 'Review cannot be empty' }, { status: 400 });
    }

    if (author !== undefined && !author) {
      return NextResponse.json({ success: false, message: 'Author cannot be empty' }, { status: 400 });
    }

    if (normalizedCollection && !normalizedCollection.ok) {
      return NextResponse.json({ success: false, message: normalizedCollection.message }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      if (body.collection !== undefined) {
        await tx.reviewMedia.deleteMany({ where: { reviewId: id } });
        const rows: Prisma.ReviewMediaCreateManyInput[] = (normalizedCollection?.collection || [])
          .map((item, index) => ({
            reviewId: id,
            src: item.src,
            type: item.type,
            sortOrder: index,
          }));

        if (rows.length > 0) {
          await tx.reviewMedia.createMany({ data: rows });
        }
      }

      const updates: Record<string, unknown> = {};
      if (quote !== undefined) updates.quote = quote;
      if (author !== undefined) updates.author = author;
      if (role !== undefined) updates.role = role || null;
      if (isActive !== undefined) updates.isActive = isActive;

      if (Object.keys(updates).length > 0) {
        await tx.review.update({ where: { id }, data: updates });
      }
    });

    const updated = await db.review.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review: mapReview({
        ...updated,
        media: updated.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
      }),
    });
  } catch (error) {
    console.error('PATCH review error:', error);
    return NextResponse.json({ success: false, message: 'Invalid request', error: String(error) }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await db.review.findUnique({
      where: { id },
      include: {
        media: {
          select: { src: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    await db.review.delete({ where: { id } });

    const driveFileIds = [...new Set(existing.media
      .map((item) => extractDriveFileIdFromProxyUrl(item.src))
      .filter((value): value is string => Boolean(value)))];

    if (driveFileIds.length > 0) {
      const cleanupResults = await Promise.allSettled(
        driveFileIds.map((fileId) => deleteGoogleDriveFile(fileId)),
      );
      const failed = cleanupResults.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        console.warn('Review delete media cleanup partial failure', { reviewId: id, failed, total: driveFileIds.length });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete review', error);
    return NextResponse.json({ success: false, message: 'Failed to delete review' }, { status: 500 });
  }
}
