import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from './lib/server/admin-session';

const ADMIN_LOGIN_PATH = '/admin/login';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || '';
  const authenticated = token ? await verifyAdminSessionToken(token, secret) : false;

  if (pathname === ADMIN_LOGIN_PATH && authenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname !== ADMIN_LOGIN_PATH && !authenticated) {
    if (pathname === '/admin/verify-pending' || pathname === '/admin/forgot-password' || pathname === '/admin/reset-password') {
       return NextResponse.next();
    }
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isVerified = request.cookies.get('admin_verified')?.value === '1';

  if (authenticated && !isVerified) {
    if (pathname !== '/admin/verify-pending') {
      return NextResponse.redirect(new URL('/admin/verify-pending', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/admin/verify-pending' && authenticated && isVerified) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};