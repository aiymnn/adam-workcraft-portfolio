import { NextResponse } from 'next/server';
import {
  ADMIN_AUTH_STATE_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionTtlSeconds,
} from '@/lib/server/admin-session';
import { db } from '@/lib/server/db/client';
import { hashPassword, verifyPassword } from '@/lib/server/password';

const adminUsers = (db as unknown as {
  adminUser: {
    count: () => Promise<number>;
    findUnique: (args: { where: { username: string } }) => Promise<{
      id: string;
      username: string;
      passwordHash: string;
      isActive?: boolean | null;
    } | null>;
    create: (args: {
      data: {
        username: string;
        fullName: string;
        email: string;
        passwordHash: string;
        role: string;
      };
    }) => Promise<{
      id: string;
      username: string;
      passwordHash: string;
      isActive?: boolean | null;
    }>;
    update: (args: { where: { id: string }; data: { lastLoginAt: Date } }) => Promise<unknown>;
  };
}).adminUser;

async function createInitialAdminIfAllowed(username: string, password: string) {
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envUsername || !envPassword) return null;
  if (username !== envUsername || password !== envPassword) return null;

  const existingCount = await adminUsers.count();
  if (existingCount > 0) return null;

  return adminUsers.create({
    data: {
      username: envUsername,
      fullName: process.env.ADMIN_FULL_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || `${envUsername}@local.admin`,
      passwordHash: await hashPassword(envPassword),
      role: 'admin',
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { username?: string; password?: string };
    const username = payload.username?.trim() || '';
    const password = payload.password || '';
    const authSecret = process.env.AUTH_SECRET;

    if (!authSecret) {
      return NextResponse.json(
        { success: false, message: 'Server auth configuration is incomplete' },
        { status: 500 },
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 },
      );
    }

    let admin = await adminUsers.findUnique({ where: { username } });
    if (!admin) {
      admin = await createInitialAdminIfAllowed(username, password);
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const validPassword = await verifyPassword(password, admin.passwordHash);
    if (validPassword) {
      await adminUsers.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      const token = await createAdminSessionToken(admin.username, authSecret);
      const maxAge = getAdminSessionTtlSeconds();
      const isProd = process.env.NODE_ENV === 'production';
      const response = NextResponse.json({ success: true, message: 'Authenticated' });

      response.cookies.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      // Non-sensitive UI hint cookie for client-side route effects.
      response.cookies.set(ADMIN_AUTH_STATE_COOKIE, '1', {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 },
    );
  }
}
