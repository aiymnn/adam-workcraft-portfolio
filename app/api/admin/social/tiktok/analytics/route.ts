import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { isAdminRequestAuthenticated } from '@/lib/server/admin-auth';
import {
  getValidTikTokToken,
  fetchTikTokProfile,
  fetchTikTokVideos,
  getTikTokMockData,
  TikTokVideo,
} from '@/lib/server/tiktok';

export async function GET(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integration = await db.tiktokIntegration.findFirst();
    if (!integration) {
      return NextResponse.json({ success: true, connected: false });
    }

    // Try to get a valid token (refreshes automatically if expired)
    const token = await getValidTikTokToken();

    let profile = null;
    let videos: TikTokVideo[] = [];
    let isMock = false;

    if (token) {
      // Fetch data from real TikTok API
      const [apiProfile, apiVideos] = await Promise.all([
        fetchTikTokProfile(token),
        fetchTikTokVideos(token),
      ]);

      profile = apiProfile;
      videos = apiVideos;

      // If we got profile info, update the cached counts in the database
      if (profile) {
        await db.tiktokIntegration.update({
          where: { id: integration.id },
          data: {
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            followerCount: profile.followerCount,
            likeCount: profile.likeCount,
            videoCount: profile.videoCount,
          },
        });
      }
    }

    // Fallback to beautiful mock data if API credentials are not working or we are in a sandbox
    if (!profile || videos.length === 0) {
      const mock = getTikTokMockData(integration.username);
      profile = {
        username: integration.username,
        displayName: integration.displayName || mock.profile.displayName,
        avatarUrl: integration.avatarUrl || mock.profile.avatarUrl,
        followerCount: integration.followerCount || mock.profile.followerCount,
        likeCount: integration.likeCount || mock.profile.likeCount,
        videoCount: integration.videoCount || mock.profile.videoCount,
      };
      videos = mock.videos;
      isMock = true;
    }

    return NextResponse.json({
      success: true,
      connected: true,
      isMock,
      profile,
      videos,
    });
  } catch (error) {
    console.error('Failed to load TikTok dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Disconnect/delete TikTok integration
export async function DELETE(request: NextRequest) {
  const authenticated = await isAdminRequestAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.tiktokIntegration.deleteMany();
    return NextResponse.json({ success: true, message: 'Disconnected TikTok account successfully.' });
  } catch (error) {
    console.error('Failed to disconnect TikTok:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
