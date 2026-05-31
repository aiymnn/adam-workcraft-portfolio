import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import type { PublicSocialLinks, PublicSocialLinksVisibility } from '@/types/content';

const DEFAULT_LINKS: PublicSocialLinks = {
  x: '',
  instagram: '',
  threads: '',
  tiktok: '',
  whatsapp: '',
};

const DEFAULT_VISIBILITY: PublicSocialLinksVisibility = {
  x: true,
  instagram: true,
  threads: true,
  tiktok: true,
  whatsapp: true,
};

function mapRowsToLinks(rows: Array<{ platform: keyof PublicSocialLinks; url: string; isVisible: boolean }>): PublicSocialLinks {
  const links: PublicSocialLinks = { ...DEFAULT_LINKS };
  for (const row of rows) {
    links[row.platform] = row.url;
  }
  return links;
}

function mapRowsToVisibility(rows: Array<{ platform: keyof PublicSocialLinksVisibility; isVisible: boolean }>): PublicSocialLinksVisibility {
  const visibility: PublicSocialLinksVisibility = { ...DEFAULT_VISIBILITY };
  for (const row of rows) {
    visibility[row.platform] = row.isVisible;
  }
  return visibility;
}

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db.socialLink.findMany({
      select: { platform: true, url: true, isVisible: true },
    });

    return NextResponse.json({
      success: true,
      links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string; isVisible: boolean }>),
      visibility: mapRowsToVisibility(rows as Array<{ platform: keyof PublicSocialLinksVisibility; isVisible: boolean }>),
    });
  } catch {
    return NextResponse.json({
      success: true,
      links: { ...DEFAULT_LINKS },
      visibility: { ...DEFAULT_VISIBILITY },
    });
  }
}

export async function PUT(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { links?: Partial<PublicSocialLinks>; visibility?: Partial<PublicSocialLinksVisibility> };
    const links = body.links || {};
    const visibility = body.visibility || {};

    await db.$transaction([
      db.socialLink.upsert({ where: { platform: 'x' }, update: { url: (links.x || '').trim(), isVisible: visibility.x ?? true }, create: { platform: 'x', url: (links.x || '').trim(), isVisible: visibility.x ?? true } }),
      db.socialLink.upsert({ where: { platform: 'instagram' }, update: { url: (links.instagram || '').trim(), isVisible: visibility.instagram ?? true }, create: { platform: 'instagram', url: (links.instagram || '').trim(), isVisible: visibility.instagram ?? true } }),
      db.socialLink.upsert({ where: { platform: 'threads' }, update: { url: (links.threads || '').trim(), isVisible: visibility.threads ?? true }, create: { platform: 'threads', url: (links.threads || '').trim(), isVisible: visibility.threads ?? true } }),
      db.socialLink.upsert({ where: { platform: 'tiktok' }, update: { url: (links.tiktok || '').trim(), isVisible: visibility.tiktok ?? true }, create: { platform: 'tiktok', url: (links.tiktok || '').trim(), isVisible: visibility.tiktok ?? true } }),
      db.socialLink.upsert({ where: { platform: 'whatsapp' }, update: { url: (links.whatsapp || '').trim(), isVisible: visibility.whatsapp ?? true }, create: { platform: 'whatsapp', url: (links.whatsapp || '').trim(), isVisible: visibility.whatsapp ?? true } }),
    ]);

    const rows = await db.socialLink.findMany({ select: { platform: true, url: true, isVisible: true } });
    return NextResponse.json({
      success: true,
      links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string; isVisible: boolean }>),
      visibility: mapRowsToVisibility(rows as Array<{ platform: keyof PublicSocialLinksVisibility; isVisible: boolean }>),
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}
