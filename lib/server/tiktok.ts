import { db } from '@/lib/server/db/client';

export interface TikTokProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  followerCount: number;
  likeCount: number;
  videoCount: number;
}

export interface TikTokVideo {
  id: string;
  title: string;
  coverUrl: string;
  shareUrl: string;
  createTime: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  embedLink?: string;
}

/**
 * Retrieves the linked TikTok integration, refreshing the access token if expired.
 */
export async function getValidTikTokToken() {
  const integration = await db.tiktokIntegration.findFirst();
  if (!integration) return null;

  const now = new Date();
  // If the access token expires in less than 5 minutes, refresh it
  const isExpired = new Date(integration.tokenExpiresAt.getTime() - 5 * 60 * 1000) < now;

  if (isExpired) {
    // If the refresh token is also expired, we cannot refresh. User must re-authenticate.
    if (integration.refreshExpiresAt < now) {
      console.warn('TikTok refresh token has expired. Re-authentication required.');
      return null;
    }
    return refreshTikTokToken(integration.id, integration.refreshToken);
  }

  return integration.accessToken;
}

/**
 * Renews the TikTok access token using the refresh token
 */
async function refreshTikTokToken(id: string, refreshToken: string): Promise<string | null> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    console.error('TikTok client credentials missing during token refresh');
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_key', clientKey);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error('TikTok token refresh request failed:', await res.text());
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error('TikTok token refresh returned error:', data.error, data.error_description);
      return null;
    }

    const {
      access_token: newAccessToken,
      expires_in: expiresIn,
      refresh_token: newRefreshToken,
      refresh_expires_in: refreshExpiresIn,
    } = data;

    // Update tokens in the database
    const updated = await db.tiktokIntegration.update({
      where: { id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || refreshToken, // fallback to old refresh token if not returned
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        refreshExpiresAt: new Date(Date.now() + (refreshExpiresIn || 31536000) * 1000),
      },
    });

    return updated.accessToken;
  } catch (err) {
    console.error('Failed to refresh TikTok access token:', err);
    return null;
  }
}

/**
 * Fetches the user profile details using the display API
 */
export async function fetchTikTokProfile(accessToken: string): Promise<TikTokProfile | null> {
  try {
    const res = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,likes_count,video_count',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('Failed to fetch TikTok profile from API:', await res.text());
      return null;
    }

    const body = await res.json();
    const user = body.data?.user;

    if (!user) return null;

    return {
      username: user.username || '',
      displayName: user.display_name || '',
      avatarUrl: user.avatar_url || '',
      followerCount: user.follower_count || 0,
      likeCount: user.likes_count || 0,
      videoCount: user.video_count || 0,
    };
  } catch (err) {
    console.error('Error fetching TikTok profile:', err);
    return null;
  }
}

/**
 * Fetches the video list of the authenticated user
 */
export async function fetchTikTokVideos(accessToken: string): Promise<TikTokVideo[]> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/video/list/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 10,
        fields: 'id,title,cover_image_url,share_url,create_time,like_count,comment_count,share_count,view_count,embed_link',
      }),
    });

    if (!res.ok) {
      console.warn('Failed to fetch TikTok video list from API:', await res.text());
      return [];
    }

    const body = await res.json();
    const videos = body.data?.videos || [];

    return videos.map((v: any) => ({
      id: v.id,
      title: v.title || v.video_description || 'Untitled Video',
      coverUrl: v.cover_image_url || '',
      shareUrl: v.share_url || '',
      createTime: v.create_time || Math.floor(Date.now() / 1000),
      views: v.view_count || 0,
      likes: v.like_count || 0,
      comments: v.comment_count || 0,
      shares: v.share_count || 0,
      embedLink: v.embed_link || v.embed_html,
    }));
  } catch (err) {
    console.error('Error fetching TikTok videos:', err);
    return [];
  }
}

/**
 * Generates beautiful, premium mock data for demonstration
 */
export function getTikTokMockData(username: string): { profile: TikTokProfile; videos: TikTokVideo[] } {
  const profile: TikTokProfile = {
    username: username || 'aizzlive',
    displayName: 'Aizz Live Studio',
    avatarUrl: '/person-2.png',
    followerCount: 24500,
    likeCount: 684200,
    videoCount: 78,
  };

  const currentSecs = Math.floor(Date.now() / 1000);
  const oneDaySecs = 86400;

  const videos: TikTokVideo[] = [
    {
      id: 'v1',
      title: 'Cinematic Portrait Session behind the scenes 📸🔥 #photography #cinematic #portrait',
      coverUrl: '/hero-bg.jpg',
      shareUrl: 'https://tiktok.com',
      createTime: currentSecs - oneDaySecs * 2,
      views: 125400,
      likes: 18450,
      comments: 342,
      shares: 1205,
    },
    {
      id: 'v2',
      title: 'How I color grade my vertical videos using DaVinci Resolve 🎨✨ #colorgrading #davinci #videography',
      coverUrl: '/person-2.png',
      shareUrl: 'https://tiktok.com',
      createTime: currentSecs - oneDaySecs * 5,
      views: 89600,
      likes: 12100,
      comments: 189,
      shares: 890,
    },
    {
      id: 'v3',
      title: 'Outdoor golden hour shoot checklist! Don\'t forget these 3 things 🌅☀️ #goldenhour #camera #tips',
      coverUrl: '/hero-bg.jpg',
      shareUrl: 'https://tiktok.com',
      createTime: currentSecs - oneDaySecs * 9,
      views: 245000,
      likes: 38900,
      comments: 720,
      shares: 4500,
    },
    {
      id: 'v4',
      title: 'My client\'s reaction when they see the raw vs edited photos 🤯📸 #photography101 #editing #photoshop',
      coverUrl: '/person-2.png',
      shareUrl: 'https://tiktok.com',
      createTime: currentSecs - oneDaySecs * 14,
      views: 45100,
      likes: 5400,
      comments: 98,
      shares: 130,
    },
    {
      id: 'v5',
      title: 'Vlog: Day in the life of a commercial videographer in Kuala Lumpur 🏙️🎥 #vlog #videographer #malaysia',
      coverUrl: '/hero-bg.jpg',
      shareUrl: 'https://tiktok.com',
      createTime: currentSecs - oneDaySecs * 20,
      views: 110200,
      likes: 15400,
      comments: 290,
      shares: 980,
    },
  ];

  return { profile, videos };
}
