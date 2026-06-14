import { NextResponse } from 'next/server';
import { ADMIN_AUTH_STATE_COOKIE, ADMIN_SESSION_COOKIE } from '@/lib/server/admin-session';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(ADMIN_AUTH_STATE_COOKIE, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}