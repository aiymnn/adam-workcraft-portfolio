import { NextResponse } from 'next/server';
import {
  ADMIN_AUTH_STATE_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionTtlSeconds,
} from '@/lib/server/admin-session';
import { db } from '@/lib/server/db/client';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { sendVerificationEmail } from '@/lib/server/mailer';
import { randomBytes } from 'crypto';

// Type-safe wrapper for the AdminUser model
const adminUsers = (db as unknown as {
  adminUser: {
    count: () => Promise<number>;
    findUnique: (args: { where: { username: string } }) => Promise<{
      id: string;
      username: string;
      fullName: string;
      email: string;
      passwordHash: string;
      isActive?: boolean | null;
      isVerified?: boolean | null;
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
      fullName: string;
      email: string;
      passwordHash: string;
      isActive?: boolean | null;
      isVerified?: boolean | null;
    }>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
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
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // ── Email verification ──────────────────────────────────────────────
    if (!admin.isVerified) {
      const verificationToken = randomBytes(48).toString('hex');

      await adminUsers.update({
        where: { id: admin.id },
        data: { verificationToken, lastLoginAt: new Date() },
      });

      // Fire-and-forget – don't block the response
      void sendVerificationEmail({
        to: admin.email,
        adminName: admin.fullName,
        token: verificationToken,
      });
    } else {
      await adminUsers.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const sessionToken = await createAdminSessionToken(admin.username, authSecret);
    const maxAge = getAdminSessionTtlSeconds();
    const isSecure =
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https') === true;

    const response = NextResponse.json({ success: true, message: 'Authenticated' });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    response.cookies.set(ADMIN_AUTH_STATE_COOKIE, '1', {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    if (admin.isVerified) {
      response.cookies.set('admin_verified', '1', {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    } else {
      response.cookies.delete('admin_verified');
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 },
    );
  }
}
