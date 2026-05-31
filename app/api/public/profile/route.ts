import { NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import type { PublicAdminProfile } from '@/types/content';

const DEFAULT_PROFILE: PublicAdminProfile = {
  name: 'Adam Workcraft',
  email: 'hello@adamworkcraft.com',
  avatarUrl: '/person-2.png',
};

export async function GET() {
  const profile = await db.adminUser.findFirst({
    where: { isActive: true },
    orderBy: [
      { lastLoginAt: 'desc' },
      { createdAt: 'asc' },
    ],
    select: {
      fullName: true,
      email: true,
      avatarUrl: true,
    },
  });

  const data: PublicAdminProfile = profile
    ? {
        name: profile.fullName || DEFAULT_PROFILE.name,
        email: profile.email || DEFAULT_PROFILE.email,
        avatarUrl: profile.avatarUrl || DEFAULT_PROFILE.avatarUrl,
      }
    : DEFAULT_PROFILE;

  return NextResponse.json(
    { success: true, profile: data },
    {
      headers: {
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}