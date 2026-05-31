import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { deleteGoogleDriveFile } from '@/lib/server/google-drive';
import { MIN_STORY_LOOP_LOGOS } from '@/lib/story-loop-logos';
import type { StoryLoopImagePublicItem } from '@/types/content';

interface StoryLoopImageUpdatePayload {
  name?: string;
  src?: string;
  order?: number;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function extractDriveFileIdFromProxyUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/media\/([^/?#]+)/i);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function mapStoryLoopImage(row: {
  id: string;
  name: string;
  src: string;
  sortOrder: number;
}): StoryLoopImagePublicItem {
  return {
    id: row.id,
    name: row.name,
    src: row.src,
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
    const body = (await request.json()) as StoryLoopImageUpdatePayload;
    const existing = await db.storyLoopLogo.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Image not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = normalizeText(body.name);
      if (!name) {
        return NextResponse.json({ success: false, message: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.src !== undefined) {
      const src = normalizeText(body.src);
      if (!src) {
        return NextResponse.json({ success: false, message: 'Image is required' }, { status: 400 });
      }
      updates.src = src;
    }

    if (body.order !== undefined) {
      const order = Number(body.order);
      if (!Number.isFinite(order)) {
        return NextResponse.json({ success: false, message: 'Order must be a number' }, { status: 400 });
      }
      updates.sortOrder = Math.max(0, Math.floor(order));
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, logo: mapStoryLoopImage(existing) });
    }

    const updated = await db.storyLoopLogo.update({
      where: { id },
      data: updates,
    });

    if (body.src !== undefined && existing.src !== updated.src) {
      const oldFileId = extractDriveFileIdFromProxyUrl(existing.src);
      if (oldFileId) {
        try {
          await deleteGoogleDriveFile(oldFileId);
        } catch {
          console.warn('Story loop image media cleanup failed after update', { id, oldFileId });
        }
      }
    }

    return NextResponse.json({
      success: true,
      logo: mapStoryLoopImage(updated),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json(
        {
          success: false,
          message: 'Story loop images table is not ready yet. Please run database migrations.',
        },
        { status: 503 },
      );
    }

    console.error('Failed to update story loop image', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update story loop image' },
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
    const existing = await db.storyLoopLogo.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Image not found' }, { status: 404 });
    }

    const currentCount = await db.storyLoopLogo.count();
    if (currentCount <= MIN_STORY_LOOP_LOGOS) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete below minimum of ${MIN_STORY_LOOP_LOGOS} Story images`,
        },
        { status: 409 },
      );
    }

    const driveFileId = extractDriveFileIdFromProxyUrl(existing.src);
    if (driveFileId) {
      try {
        await deleteGoogleDriveFile(driveFileId);
      } catch (error) {
        console.error('Failed to delete Story loop image from Drive', { id, driveFileId, error });
        return NextResponse.json(
          { success: false, message: 'Failed to delete image from Drive. Please try again.' },
          { status: 502 },
        );
      }
    }

    await db.storyLoopLogo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json(
        {
          success: false,
          message: 'Story loop images table is not ready yet. Please run database migrations.',
        },
        { status: 503 },
      );
    }

    console.error('Failed to delete story loop image', error);
    return NextResponse.json({ success: false, message: 'Failed to delete image' }, { status: 500 });
  }
}
