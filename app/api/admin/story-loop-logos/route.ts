import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { MIN_STORY_LOOP_LOGOS } from '@/lib/story-loop-logos';
import type { StoryLoopImagePublicItem } from '@/types/content';

interface StoryLoopImagePayload {
  name?: string;
  src?: string;
  order?: number;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db.storyLoopLogo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      logos: rows.map((row) => mapStoryLoopImage(row)),
      minimumRequired: MIN_STORY_LOOP_LOGOS,
      fallbackActive: rows.length < MIN_STORY_LOOP_LOGOS,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.warn('story_loop_logos table is not available yet; returning empty list for admin fallback');
      return NextResponse.json({
        success: true,
        logos: [],
        minimumRequired: MIN_STORY_LOOP_LOGOS,
        fallbackActive: true,
      });
    }

    console.error('Failed to list story loop images', error);
    return NextResponse.json({ success: false, message: 'Failed to load story loop images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as StoryLoopImagePayload;
    const providedName = normalizeText(body.name);
    const src = normalizeText(body.src);

    if (!src) {
      return NextResponse.json({ success: false, message: 'Image is required' }, { status: 400 });
    }

    const requestedOrder = Number(body.order);

    const latestRow = await db.storyLoopLogo.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = Number.isFinite(requestedOrder)
      ? Math.max(0, Math.floor(requestedOrder))
      : (latestRow?.sortOrder ?? -1) + 1;
    const name = providedName || `Story Image ${nextOrder + 1}`;

    const created = await db.storyLoopLogo.create({
      data: {
        name,
        src,
        sortOrder: nextOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        logo: mapStoryLoopImage(created),
      },
      { status: 201 },
    );
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

    console.error('Failed to create story loop image', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create story loop image' },
      { status: 400 },
    );
  }
}
