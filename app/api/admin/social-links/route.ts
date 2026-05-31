import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { PublicSocialLinks } from '@/types/content';

const DEFAULT_LINKS: PublicSocialLinks = {
  x: '',
  instagram: '',
  threads: '',
  tiktok: '',
  whatsapp: '',
};

function mapRowsToLinks(rows: Array<{ platform: keyof PublicSocialLinks; url: string }>): PublicSocialLinks {
  const links: PublicSocialLinks = { ...DEFAULT_LINKS };
  for (const row of rows) {
    links[row.platform] = row.url;
  }
  return links;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.socialLink.findMany({
    select: { platform: true, url: true },
  });

  return NextResponse.json({ success: true, links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string }>) });
}

export async function PUT(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { links?: Partial<PublicSocialLinks> };
    const links = body.links || {};

    await db.$transaction([
      db.socialLink.upsert({ where: { platform: 'x' }, update: { url: (links.x || '').trim() }, create: { platform: 'x', url: (links.x || '').trim() } }),
      db.socialLink.upsert({ where: { platform: 'instagram' }, update: { url: (links.instagram || '').trim() }, create: { platform: 'instagram', url: (links.instagram || '').trim() } }),
      db.socialLink.upsert({ where: { platform: 'threads' }, update: { url: (links.threads || '').trim() }, create: { platform: 'threads', url: (links.threads || '').trim() } }),
      db.socialLink.upsert({ where: { platform: 'tiktok' }, update: { url: (links.tiktok || '').trim() }, create: { platform: 'tiktok', url: (links.tiktok || '').trim() } }),
      db.socialLink.upsert({ where: { platform: 'whatsapp' }, update: { url: (links.whatsapp || '').trim() }, create: { platform: 'whatsapp', url: (links.whatsapp || '').trim() } }),
    ]);

    const rows = await db.socialLink.findMany({ select: { platform: true, url: true } });
    return NextResponse.json({ success: true, links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string }>) });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
