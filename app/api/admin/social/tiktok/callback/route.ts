import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aizzlive.tech';
  const dashboardUrl = `${siteUrl}/admin/social/tiktok`;

  // 1. Handle error from TikTok redirect
  if (error) {
    console.error('TikTok OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${dashboardUrl}?error=${encodeURIComponent(errorDescription || error)}`);
  }

  // 2. Validate state to prevent CSRF
  const savedState = request.cookies.get('tiktok_oauth_state')?.value;
  if (!state || state !== savedState) {
    console.error('TikTok OAuth state mismatch');
    return NextResponse.redirect(`${dashboardUrl}?error=state_mismatch`);
  }

  if (!code) {
    console.error('TikTok OAuth missing authorization code');
    return NextResponse.redirect(`${dashboardUrl}?error=missing_code`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    console.error('TikTok credentials missing in env');
    return NextResponse.redirect(`${dashboardUrl}?error=server_credentials_missing`);
  }

  try {
    const redirectUri = `${siteUrl}/api/admin/social/tiktok/callback`;

    // 3. Exchange authorization code for access token
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_key', clientKey);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('code', code);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('redirect_uri', redirectUri);

    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('TikTok Token Exchange failed:', errorText);
      return NextResponse.redirect(`${dashboardUrl}?error=token_exchange_failed`);
    }

    interface TikTokTokenResponse {
      access_token: string;
      expires_in: number;
      refresh_token: string;
      refresh_expires_in: number;
      open_id: string;
      error?: string;
      error_description?: string;
    }

    const tokenData = (await tokenRes.json()) as TikTokTokenResponse;

    if (tokenData.error) {
      console.error('TikTok Token Response contained error:', tokenData.error, tokenData.error_description);
      return NextResponse.redirect(`${dashboardUrl}?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`);
    }

    const {
      access_token: accessToken,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      refresh_expires_in: refreshExpiresIn,
    } = tokenData;

    // 4. Retrieve TikTok User Profile Info
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,likes_count,video_count',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    let username = 'connected_user';
    let displayName = 'TikTok User';
    let avatarUrl = '';
    let followerCount = 0;
    let likeCount = 0;
    let videoCount = 0;

    if (profileRes.ok) {
      interface TikTokProfileResponse {
        data?: {
          user?: {
            username?: string;
            display_name?: string;
            avatar_url?: string;
            follower_count?: number;
            likes_count?: number;
            video_count?: number;
          };
        };
      }
      const profileData = (await profileRes.json()) as TikTokProfileResponse;
      const user = profileData.data?.user;
      if (user) {
        username = user.username || username;
        displayName = user.display_name || displayName;
        avatarUrl = user.avatar_url || avatarUrl;
        followerCount = user.follower_count || 0;
        likeCount = user.likes_count || 0;
        videoCount = user.video_count || 0;
      }
    } else {
      console.warn('Could not retrieve TikTok profile info:', await profileRes.text());
    }

    // 5. Save the integration in the database
    // Clear any previous integration to ensure at most one active TikTok account is linked
    await db.tiktokIntegration.deleteMany();

    await db.tiktokIntegration.create({
      data: {
        username,
        displayName,
        avatarUrl,
        followerCount,
        likeCount,
        videoCount,
        accessToken,
        refreshToken,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        refreshExpiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
      },
    });

    // Clean up state cookie
    const successResponse = NextResponse.redirect(`${dashboardUrl}?success=true`);
    successResponse.cookies.delete('tiktok_oauth_state');
    return successResponse;
  } catch (err) {
    console.error('Error during TikTok OAuth callback processing:', err);
    return NextResponse.redirect(`${dashboardUrl}?error=internal_server_error`);
  }
}
