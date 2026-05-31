import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { getAdminSessionUsername } from '@/lib/server/admin-session';
import { verifyAdminSessionToken } from '@/lib/server/admin-session';
import type { PublicAdminProfile } from '@/types/content';

function getRequestUsername(request: NextRequest): string | null {
  const token = request.cookies.get('admin_session')?.value;
  const secret = process.env.AUTH_SECRET || '';
  if (!token || !secret) return null;
  return getAdminSessionUsername(token) && verifyAdminSessionToken(token, secret) ? getAdminSessionUsername(token) : null;
}

export async function GET(request: NextRequest) {
  const username = getRequestUsername(request);
  if (!username) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const admin = await db.adminUser.findUnique({
    where: { username },
    select: {
      fullName: true,
      email: true,
      avatarUrl: true,
    },
  });

  const profile: PublicAdminProfile = {
    name: admin?.fullName || 'Adam Workcraft',
    email: admin?.email || 'hello@adamworkcraft.com',
    avatarUrl: admin?.avatarUrl || '/person-2.png',
  };

  return NextResponse.json({ success: true, profile });
}

export async function PATCH(request: NextRequest) {
  const username = getRequestUsername(request);
  if (!username) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { name?: string; email?: string; avatarUrl?: string };
    const name = body.name?.trim() || 'Adam Workcraft';
    const email = body.email?.trim().toLowerCase() || 'hello@adamworkcraft.com';
    const avatarUrl = body.avatarUrl?.trim() || '/person-2.png';

    const updated = await db.adminUser.update({
      where: { username },
      data: {
        fullName: name,
        email,
        avatarUrl,
      },
      select: {
        fullName: true,
        email: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        name: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl || '/person-2.png',
      } satisfies PublicAdminProfile,
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }
}