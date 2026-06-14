import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { deleteGoogleDriveFile } from '@/lib/server/google-drive';
import type { PublicVaultCollection } from '@/types/content';

interface VaultUpdatePayload {
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

function extractDriveFileIdFromProxyUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/media\/([^/?#]+)/i);
  if (!match) return null;
  return decodeURIComponent(match[1]);
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
    const body = (await request.json()) as VaultUpdatePayload;

    const existing = await db.vaultCollection.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    const title = body.title !== undefined ? normalizeText(body.title) : undefined;
    const category = body.category !== undefined ? normalizeText(body.category) : undefined;
    const imageMedia = body.media !== undefined ? normalizeUrlList(body.media) : undefined;
    const videoMedia = body.videos !== undefined ? normalizeUrlList(body.videos) : undefined;

    if (title !== undefined && !title) {
      return NextResponse.json({ success: false, message: 'Title cannot be empty' }, { status: 400 });
    }

    let categoryName: string | undefined;
    if (category !== undefined) {
      if (category !== 'Photography' && category !== 'Videography') {
        return NextResponse.json({ success: false, message: 'Invalid category. Must be Photography or Videography.' }, { status: 400 });
      }
      categoryName = category;
    }

    const existingImages = existing.media.filter((item) => item.type === 'image').map((item) => item.src);
    const existingVideos = existing.media.filter((item) => item.type === 'video').map((item) => item.src);
    const nextImages = imageMedia ?? existingImages;
    const nextVideos = videoMedia ?? existingVideos;
    const nextIsVideo = categoryName !== undefined ? categoryName === 'Videography' : existing.isVideo;

    if (nextIsVideo && nextVideos.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one video is required for Videography collections' }, { status: 400 });
    }

    if (!nextIsVideo && nextImages.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one image is required for Photography collections' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      if (imageMedia !== undefined || videoMedia !== undefined) {
        await tx.vaultMedia.deleteMany({ where: { collectionId: id } });

        const images = imageMedia || [];
        const videos = videoMedia || [];

        if (images.length > 0 || videos.length > 0) {
          await tx.vaultMedia.createMany({
            data: [
              ...images.map((src, index) => ({ collectionId: id, src, type: 'image' as const, sortOrder: index })),
              ...videos.map((src, index) => ({ collectionId: id, src, type: 'video' as const, sortOrder: images.length + index })),
            ],
          });
        }
      }

      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (categoryName !== undefined) {
        updates.category = categoryName;
        updates.isVideo = categoryName === 'Videography';
      }
      if (body.columnSpan !== undefined) updates.columnSpan = Math.min(3, Math.max(1, Number(body.columnSpan)));
      if (body.rowSpan !== undefined) updates.rowSpan = Math.min(2, Math.max(1, Number(body.rowSpan)));
      if (body.order !== undefined) updates.sortOrder = Math.max(0, Number(body.order));

      if (imageMedia !== undefined || videoMedia !== undefined || body.isVideo !== undefined) {
        updates.thumb = nextImages[0] || nextVideos[0] || existing.thumb;
      }

      if (Object.keys(updates).length > 0) {
        await tx.vaultCollection.update({ where: { id }, data: updates });
      }
    });

    const updated = await db.vaultCollection.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      collection: mapVaultCollection({
        ...updated,
        media: updated.media.map((m) => ({ src: m.src, type: m.type as 'image' | 'video', sortOrder: m.sortOrder })),
      }),
    });
  } catch (error) {
    console.error('Failed to update vault collection', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
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
    const existing = await db.vaultCollection.findUnique({
      where: { id },
      include: {
        media: {
          select: { src: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 });
    }

    await db.vaultCollection.delete({ where: { id } });

    const driveFileIds = [...new Set(existing.media
      .map((item) => extractDriveFileIdFromProxyUrl(item.src))
      .filter((value): value is string => Boolean(value)))];

    if (driveFileIds.length > 0) {
      const cleanupResults = await Promise.allSettled(
        driveFileIds.map((fileId) => deleteGoogleDriveFile(fileId)),
      );
      const failed = cleanupResults.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        console.warn('Vault delete media cleanup partial failure', { collectionId: id, failed, total: driveFileIds.length });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete vault collection', error);
    return NextResponse.json({ success: false, message: 'Failed to delete collection' }, { status: 500 });
  }
}
