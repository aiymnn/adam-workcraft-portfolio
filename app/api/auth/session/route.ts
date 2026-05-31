import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/server/admin-session';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET || '';
  const authenticated = token ? await verifyAdminSessionToken(token, secret) : false;

  return NextResponse.json({ authenticated });
}