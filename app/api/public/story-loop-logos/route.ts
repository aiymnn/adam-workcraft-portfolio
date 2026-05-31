import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import {
  DEFAULT_STORY_LOOP_IMAGES_SETTINGS,
  MIN_STORY_LOOP_LOGOS,
  STORY_LOOP_IMAGES_SETTINGS_KEY,
  shuffleStoryLoopItems,
} from '@/lib/story-loop-logos';
import type { StoryLoopImagePublicItem } from '@/types/content';

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

async function loadRandomizeOrderSetting(): Promise<boolean> {
  try {
    const settingsEntry = await db.siteContent.findUnique({
      where: { key: STORY_LOOP_IMAGES_SETTINGS_KEY },
      select: { value: true },
    });

    const randomize = (settingsEntry?.value as { randomizeOrder?: unknown } | null)?.randomizeOrder;
    return typeof randomize === 'boolean'
      ? randomize
      : DEFAULT_STORY_LOOP_IMAGES_SETTINGS.randomizeOrder;
  } catch {
    return DEFAULT_STORY_LOOP_IMAGES_SETTINGS.randomizeOrder;
  }
}

export async function GET() {
  try {
    const rows = await db.storyLoopLogo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const randomizeOrder = await loadRandomizeOrderSetting();
    const orderedRows = randomizeOrder ? shuffleStoryLoopItems(rows) : rows;

    return NextResponse.json(
      {
        success: true,
        logos: orderedRows.map((row) => mapStoryLoopImage(row)),
        settings: {
          randomizeOrder,
        },
        minimumRequired: MIN_STORY_LOOP_LOGOS,
        fallbackActive: rows.length < MIN_STORY_LOOP_LOGOS,
      },
      {
        headers: {
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.warn('story_loop_logos table is not available yet; returning empty public list for fallback');
      return NextResponse.json(
        {
          success: true,
          logos: [],
          minimumRequired: MIN_STORY_LOOP_LOGOS,
          fallbackActive: true,
        },
        {
          headers: {
            'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        },
      );
    }

    console.error('Failed to list public story loop images', error);
    return NextResponse.json({ success: false, logos: [] }, { status: 500 });
  }
}
