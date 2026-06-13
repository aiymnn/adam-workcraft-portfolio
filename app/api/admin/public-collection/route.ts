import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';

interface PublicCollectionPayload {
  title?: string;
  src?: string;
  type?: 'image' | 'video';
  section?: 'about' | 'expertise' | 'hero';
  order?: number;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sectionFilter = searchParams.get('section');

  try {
    const whereClause = sectionFilter ? { section: sectionFilter as any } : {};

    const rows = await db.publicCollection.findMany({
      where: whereClause,
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error) {
    console.error('Failed to list public collection items', error);
    return NextResponse.json({ success: false, message: 'Failed to load public collection' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PublicCollectionPayload;
    const src = normalizeText(body.src);

    if (!src) {
      return NextResponse.json({ success: false, message: 'Media source (src) is required' }, { status: 400 });
    }

    const type = body.type === 'image' ? 'image' : 'video';
    const section = body.section && ['about', 'expertise', 'hero'].includes(body.section) ? body.section : 'about';
    const requestedOrder = Number(body.order);

    const latestRow = await db.publicCollection.findFirst({
      where: { section: section as any },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const nextOrder = Number.isFinite(requestedOrder)
      ? Math.max(0, Math.floor(requestedOrder))
      : (latestRow?.sortOrder ?? -1) + 1;

    const created = await db.publicCollection.create({
      data: {
        title: normalizeText(body.title) || `Media ${nextOrder + 1}`,
        src,
        type,
        section: section as any,
        sortOrder: nextOrder,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        item: created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create public collection item', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create item' },
      { status: 400 },
    );
  }
}
