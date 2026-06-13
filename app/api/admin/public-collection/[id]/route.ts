import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { deleteGoogleDriveFile } from '@/lib/server/google-drive';

interface PublicCollectionUpdatePayload {
  title?: string;
  src?: string;
  type?: 'image' | 'video';
  section?: 'about' | 'expertise' | 'hero';
  order?: number;
  isActive?: boolean;
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
    const body = (await request.json()) as PublicCollectionUpdatePayload;
    const existing = await db.publicCollection.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updates.title = normalizeText(body.title);
    }

    if (body.src !== undefined) {
      const src = normalizeText(body.src);
      if (!src) {
        return NextResponse.json({ success: false, message: 'Source is required' }, { status: 400 });
      }
      updates.src = src;
    }

    if (body.type !== undefined) {
      updates.type = body.type;
    }

    if (body.section !== undefined) {
      updates.section = body.section;
    }

    if (body.order !== undefined) {
      const order = Number(body.order);
      if (!Number.isFinite(order)) {
        return NextResponse.json({ success: false, message: 'Order must be a number' }, { status: 400 });
      }
      updates.sortOrder = Math.max(0, Math.floor(order));
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, item: existing });
    }

    const updated = await db.publicCollection.update({
      where: { id },
      data: updates,
    });

    if (body.src !== undefined && existing.src !== updated.src) {
      const oldFileId = extractDriveFileIdFromProxyUrl(existing.src);
      if (oldFileId) {
        try {
          await deleteGoogleDriveFile(oldFileId);
        } catch {
          console.warn('Public collection media cleanup failed after update', { id, oldFileId });
        }
      }
    }

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error) {
    console.error('Failed to update public collection item', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update item' },
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
    const existing = await db.publicCollection.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    }

    const driveFileId = extractDriveFileIdFromProxyUrl(existing.src);
    if (driveFileId) {
      try {
        await deleteGoogleDriveFile(driveFileId);
      } catch (error) {
        console.error('Failed to delete item from Drive', { id, driveFileId, error });
        return NextResponse.json(
          { success: false, message: 'Failed to delete media from Drive. Please try again.' },
          { status: 502 },
        );
      }
    }

    await db.publicCollection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item', error);
    return NextResponse.json({ success: false, message: 'Failed to delete item' }, { status: 500 });
  }
}
