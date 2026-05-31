import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { VaultCategoryItem } from '@/types/content';

interface CategoryPayload {
  name?: string;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

async function buildUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'category';
  let candidate = base;
  let suffix = 1;

  while (true) {
    const exists = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM vault_categories
      WHERE slug = ${candidate}
      LIMIT 1
    `;
    if (exists.length === 0) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`.slice(0, 64);
  }
}

function mapCategory(row: {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  usageCount?: number;
}): VaultCategoryItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    usageCount: row.usageCount ?? 0,
  };
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.$queryRaw<Array<{
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
  }>>`
    SELECT id, name, slug, sort_order, is_active
    FROM vault_categories
    ORDER BY sort_order ASC, name ASC
  `;

  const usageBuckets = await db.vaultCollection.groupBy({
    by: ['category'],
    _count: { _all: true },
  });

  const usageMap = new Map<string, number>();
  for (const bucket of usageBuckets) {
    usageMap.set(bucket.category, bucket._count._all);
  }

  return NextResponse.json({
    success: true,
    categories: rows.map((row) => mapCategory({ ...row, usageCount: usageMap.get(row.name) ?? 0 })),
  });
}

export async function POST(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CategoryPayload;
    const name = normalizeText(body.name);

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const existingByName = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM vault_categories
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (existingByName.length > 0) {
      return NextResponse.json({ success: false, message: 'Category already exists' }, { status: 409 });
    }

    const lastSort = await db.$queryRaw<Array<{ sort_order: number | null }>>`
      SELECT MAX(sort_order)::int AS sort_order
      FROM vault_categories
    `;

    const created = await db.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      sort_order: number;
      is_active: boolean;
    }>>`
      INSERT INTO vault_categories (name, slug, sort_order, is_active, created_at, updated_at)
      VALUES (${name}, ${await buildUniqueSlug(name)}, ${(lastSort[0]?.sort_order ?? -1) + 1}, true, NOW(), NOW())
      RETURNING id, name, slug, sort_order, is_active
    `;

    return NextResponse.json(
      {
        success: true,
        category: mapCategory(created[0]),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
