import { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/server/admin-session';

export async function isAdminRequestAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || '';
  if (!token || !secret) return false;
  return verifyAdminSessionToken(token, secret);
}
