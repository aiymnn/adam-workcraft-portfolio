import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json(
      { success: false, message: 'TikTok Client Key is not configured on the server.' },
      { status: 500 }
    );
  }

  // Determine redirect URI
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aizzlive.tech';
  const redirectUri = `${siteUrl}/api/admin/social/tiktok/callback`;

  // CSRF protection state
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.append('client_key', clientKey);
  authUrl.searchParams.append('scope', 'user.info.basic,video.list');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);

  // Set the state in a cookie so we can verify it in the callback
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('tiktok_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 300, // 5 minutes
    sameSite: 'lax',
  });

  return response;
}
