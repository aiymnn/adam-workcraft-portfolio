import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { VaultCategoryItem } from '@/types/content';

interface CategoryUpdatePayload {
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

async function buildUniqueSlug(baseName: string, excludeId: string): Promise<string> {
  const base = slugify(baseName) || 'category';
  let candidate = base;
  let suffix = 1;

  while (true) {
    const exists = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM vault_categories
      WHERE slug = ${candidate}
        AND id <> ${excludeId}
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
    const body = (await request.json()) as CategoryUpdatePayload;
    const name = normalizeText(body.name);

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const categoryRows = await db.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      sort_order: number;
      is_active: boolean;
    }>>`
      SELECT id, name, slug, sort_order, is_active
      FROM vault_categories
      WHERE id = ${id}
      LIMIT 1
    `;
    const category = categoryRows[0];
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const duplicateName = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM vault_categories
      WHERE id <> ${id}
        AND LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (duplicateName.length > 0) {
      return NextResponse.json({ success: false, message: 'Category already exists' }, { status: 409 });
    }

    const nextSlug = await buildUniqueSlug(name, id);

    await db.$transaction(async (tx) => {
      if (category.name !== name) {
        await tx.$executeRaw`
          UPDATE vault_collections
          SET category = ${name}
          WHERE category = ${category.name}
        `;
      }

      await tx.$executeRaw`
        UPDATE vault_categories
        SET name = ${name}, slug = ${nextSlug}, updated_at = NOW()
        WHERE id = ${id}
      `;
    });

    const hydratedRows = await db.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      sort_order: number;
      is_active: boolean;
    }>>`
      SELECT id, name, slug, sort_order, is_active
      FROM vault_categories
      WHERE id = ${id}
      LIMIT 1
    `;
    const hydrated = hydratedRows[0];

    if (!hydrated) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const usageCountRows = await db.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM vault_collections
      WHERE category = ${hydrated.name}
    `;
    const usageCount = usageCountRows[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      category: mapCategory({ ...hydrated, usageCount }),
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
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

  const categoryRows = await db.$queryRaw<Array<{
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
  }>>`
    SELECT id, name, slug, sort_order, is_active
    FROM vault_categories
    WHERE id = ${id}
    LIMIT 1
  `;
  const category = categoryRows[0];
  if (!category) {
    return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
  }

  const usageCountRows = await db.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM vault_collections
    WHERE category = ${category.name}
  `;
  const usageCount = usageCountRows[0]?.count ?? 0;
  if (usageCount > 0) {
    return NextResponse.json({
      success: false,
      message: 'Cannot delete category while it is used by existing collections',
    }, { status: 409 });
  }

  await db.$executeRaw`
    DELETE FROM vault_categories
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}
