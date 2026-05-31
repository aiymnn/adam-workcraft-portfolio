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

function mapRowsToLinks(rows: Array<{ platform: keyof PublicSocialLinks; url: string }>): PublicSocialLinks {
  const links: PublicSocialLinks = { ...DEFAULT_LINKS };
  for (const row of rows) {
    links[row.platform] = row.url;
  }
  return links;
}

export async function GET() {
  const rows = await db.socialLink.findMany({ select: { platform: true, url: true } });

  return NextResponse.json(
    {
      success: true,
      links: mapRowsToLinks(rows as Array<{ platform: keyof PublicSocialLinks; url: string }>),
    },
    {
      headers: {
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
