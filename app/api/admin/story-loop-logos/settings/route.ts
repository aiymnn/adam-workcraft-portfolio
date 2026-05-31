import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import { db } from '@/lib/server/db/client';
import {
  DEFAULT_STORY_LOOP_IMAGES_SETTINGS,
  STORY_LOOP_IMAGES_SETTINGS_KEY,
  type StoryLoopImagesSettings,
} from '@/lib/story-loop-logos';

interface StoryLoopImagesSettingsPayload {
  randomizeOrder?: boolean;
}

function normalizeSettings(value: unknown): StoryLoopImagesSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_STORY_LOOP_IMAGES_SETTINGS };
  }

  const randomizeOrder =
    typeof (value as { randomizeOrder?: unknown }).randomizeOrder === 'boolean'
      ? (value as { randomizeOrder: boolean }).randomizeOrder
      : DEFAULT_STORY_LOOP_IMAGES_SETTINGS.randomizeOrder;

  return {
    randomizeOrder,
  };
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await db.siteContent.findUnique({
      where: { key: STORY_LOOP_IMAGES_SETTINGS_KEY },
      select: { value: true },
    });

    return NextResponse.json({
      success: true,
      settings: normalizeSettings(existing?.value),
    });
  } catch (error) {
    console.error('Failed to load story loop image settings', error);
    return NextResponse.json({
      success: true,
      settings: { ...DEFAULT_STORY_LOOP_IMAGES_SETTINGS },
    });
  }
}

export async function PATCH(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as StoryLoopImagesSettingsPayload;

    if (typeof body.randomizeOrder !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'randomizeOrder must be a boolean' },
        { status: 400 },
      );
    }

    const nextSettings: StoryLoopImagesSettings = {
      randomizeOrder: body.randomizeOrder,
    };

    await db.siteContent.upsert({
      where: { key: STORY_LOOP_IMAGES_SETTINGS_KEY },
      update: { value: nextSettings },
      create: {
        key: STORY_LOOP_IMAGES_SETTINGS_KEY,
        value: nextSettings,
      },
    });

    return NextResponse.json({
      success: true,
      settings: nextSettings,
    });
  } catch (error) {
    console.error('Failed to update story loop image settings', error);
    return NextResponse.json({ success: false, message: 'Failed to update settings' }, { status: 500 });
  }
}
