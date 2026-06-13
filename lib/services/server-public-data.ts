import { db } from '@/lib/server/db/client';
import type { PublicAdminProfile, PublicReviewItem, PublicVaultCollection } from '@/types/content';

const DEFAULT_PROFILE: PublicAdminProfile = {
  name: 'Adam Workcraft',
  email: 'hello@adamworkcraft.com',
  avatarUrl: '/person-2.png',
};

export async function getServerPublicProfile(): Promise<PublicAdminProfile> {
  try {
    const profile = await db.adminUser.findFirst({
      where: { isActive: true },
      orderBy: [{ lastLoginAt: 'desc' }, { createdAt: 'asc' }],
      select: { fullName: true, email: true, avatarUrl: true },
    });
    return profile
      ? {
          name: profile.fullName || DEFAULT_PROFILE.name,
          email: profile.email || DEFAULT_PROFILE.email,
          avatarUrl: profile.avatarUrl || DEFAULT_PROFILE.avatarUrl,
        }
      : DEFAULT_PROFILE;
  } catch (error) {
    console.error('getServerPublicProfile error:', error);
    return DEFAULT_PROFILE;
  }
}

export async function getServerPublicCollection(section?: 'about' | 'expertise' | 'hero') {
  try {
    const whereClause = section ? { section, isActive: true } : { isActive: true };
    const rows = await db.publicCollection.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows;
  } catch (error) {
    console.error('getServerPublicCollection error:', error);
    return [];
  }
}

export async function getServerPublicVaults(limit = 6): Promise<PublicVaultCollection[]> {
  try {
    const vaults = await db.vaultCollection.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 5,
        },
      },
    });

    return vaults.map((v) => ({
      id: v.id,
      title: v.title,
      category: v.category,
      thumb: v.thumb,
      isVideo: v.isVideo,
      columnSpan: v.columnSpan,
      rowSpan: v.rowSpan,
      order: v.sortOrder,
      media: v.media.filter(m => m.type === 'image').map(m => m.src),
      videos: v.media.filter(m => m.type === 'video').map(m => m.src),
    }));
  } catch (error) {
    console.error('getServerPublicVaults error:', error);
    return [];
  }
}

export async function getServerPublicReviews(limit = 6): Promise<PublicReviewItem[]> {
  try {
    const rows = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 4,
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      role: r.role || 'Client',
      quote: r.quote,
      collection: r.media.map(m => ({ src: m.src, type: m.type as 'image' | 'video' })),
    }));
  } catch (error) {
    console.error('getServerPublicReviews error:', error);
    return [];
  }
}
