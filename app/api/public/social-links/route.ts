import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import type { PublicSocialLinks } from '@/types/content';

const DEFAULT_LINKS: PublicSocialLinks = {
  x: '',
  instagram: '',
  threads: '',
  tiktok: '',
  whatsapp: '',
};

function mapRowsToLinks(rows: Array<{ platform: keyof PublicSocialLinks; url: string; isVisible: boolean }>): PublicSocialLinks {
  const links: PublicSocialLinks = { ...DEFAULT_LINKS };
  for (const row of rows) {
    if (row.isVisible) {
      links[row.platform] = row.url;
    }
  }
  return links;
}

export async function GET() {
  try {
    const rows = await db.socialLink.findMany({ select: { platform: true, url: true, isVisible: true } });

    return NextResponse.json(
      {
        success: true,
        links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string; isVisible: boolean }>),
      },
      {
        headers: {
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        links: { ...DEFAULT_LINKS },
      },
      {
        headers: {
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  }
}
