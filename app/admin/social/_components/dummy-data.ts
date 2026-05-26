import type { SocialPlatformId } from '@/lib/constants';
import type { StatCard, GrowthPoint, TopPost, PlatformDummyData } from '@/types/social';

const PLATFORM_KEYS: SocialPlatformId[] = ['x', 'instagram', 'threads', 'tiktok', 'whatsapp'];

function deterministicValue(platformIdx: number, offset: number, max: number, min: number): number {
  const v = ((platformIdx * 7 + offset * 13) % 97) / 97;
  return Math.floor(v * (max - min) + min);
}

function generateGrowth(base: number, days: number, platformIdx: number): GrowthPoint[] {
  const points: GrowthPoint[] = [];
  let current = base;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const bump = deterministicValue(platformIdx, i, 50, 5);
    current += bump;
    points.push({ date: d.toISOString().slice(0, 10), value: current });
  }
  return points;
}

function generateBarWeekly(platformIdx: number): number[] {
  return [15, 22, 18, 28, 32, 12, 8].map((base, day) => {
    const noise = ((platformIdx * 11 + day * 17) % 11) - 5;
    return Math.max(2, base + noise);
  });
}

function generateBarMonthly(platformIdx: number): number[] {
  return Array.from({ length: 4 }, (_, w) => {
    const v = ((platformIdx * 13 + w * 23) % 71) / 71;
    return Math.floor(v * 80 + 20);
  });
}

function generateBarYearly(platformIdx: number): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    const v = ((platformIdx * 17 + m * 11) % 97) / 97;
    return Math.floor(v * 200 + 50);
  });
}

const POSTS_BY_PLATFORM: Record<SocialPlatformId, { title: string; metric: string }[]> = {
  x: [
    { title: 'Thread about latest shoot', metric: '2.1K reposts' },
    { title: 'Behind the scenes reel', metric: '1.8K reposts' },
    { title: 'Client testimonial highlight', metric: '1.4K reposts' },
    { title: 'Portfolio drop #23', metric: '982 reposts' },
    { title: 'Industry trend take', metric: '756 reposts' },
  ],
  instagram: [
    { title: 'Golden hour carousel', metric: '4.2K likes' },
    { title: 'Wedding highlight reel', metric: '3.8K likes' },
    { title: 'Product showcase post', metric: '2.9K likes' },
    { title: 'Studio BTS story', metric: '2.1K likes' },
    { title: 'Client feedback share', metric: '1.7K likes' },
  ],
  threads: [
    { title: 'Morning thoughts on gear', metric: '892 reposts' },
    { title: 'Quick editing tip', metric: '654 reposts' },
    { title: 'Community shoutout', metric: '521 reposts' },
    { title: 'Weekly roundup', metric: '412 reposts' },
    { title: 'Question for followers', metric: '334 reposts' },
  ],
  tiktok: [
    { title: 'Day in the life edit', metric: '45.2K views' },
    { title: 'Transition tutorial', metric: '38.7K views' },
    { title: 'Viral sound challenge', metric: '112.4K views' },
    { title: 'Equipment unboxing', metric: '28.9K views' },
    { title: 'Before/after reveal', metric: '67.3K views' },
  ],
  whatsapp: [
    { title: 'Broadcast: New package', metric: '45 responses' },
    { title: 'Client welcome message', metric: '38 responses' },
    { title: 'Weekly newsletter', metric: '32 responses' },
    { title: 'Event reminder', metric: '28 responses' },
    { title: 'Follow-up template', metric: '21 responses' },
  ],
};

function buildStats(pid: SocialPlatformId): StatCard[] {
  if (pid === 'whatsapp') {
    return [
      { label: 'Total Chats', value: '2,105', rawValue: 2105, sub: '+128 this month' },
      { label: 'Messages Sent', value: '23.8K', rawValue: 23800, sub: '+2,847 this month' },
      { label: 'Broadcast Lists', value: '12', rawValue: 12, sub: '+3 this month' },
      { label: 'Response Rate', value: '92%', rawValue: 92, sub: '+4% vs last month' },
    ];
  }
  if (pid === 'tiktok') {
    return [
      { label: 'Followers', value: '56.8K', rawValue: 56800, sub: '+3,247 this month' },
      { label: 'Total Views', value: '2.1M', rawValue: 2100000, sub: '+342K this month' },
      { label: 'Videos Posted', value: '234', rawValue: 234, sub: '+18 this month' },
      { label: 'Avg. Watch Time', value: '0:42', rawValue: 42, sub: '+0:08 vs last month' },
    ];
  }
  if (pid === 'x') {
    return [
      { label: 'Followers', value: '12.8K', rawValue: 12800, sub: '+412 this month' },
      { label: 'Total Impressions', value: '284K', rawValue: 284000, sub: '+52K this month' },
      { label: 'Posts', value: '3,421', rawValue: 3421, sub: '+89 this month' },
      { label: 'Engagement Rate', value: '4.2%', rawValue: 4.2, sub: '+0.8% vs last month' },
    ];
  }
  if (pid === 'instagram') {
    return [
      { label: 'Followers', value: '34.3K', rawValue: 34300, sub: '+1,847 this month' },
      { label: 'Profile Reach', value: '892K', rawValue: 892000, sub: '+214K this month' },
      { label: 'Posts', value: '892', rawValue: 892, sub: '+24 this month' },
      { label: 'Engagement Rate', value: '6.8%', rawValue: 6.8, sub: '+1.1% vs last month' },
    ];
  }
  return [
    { label: 'Followers', value: '8,932', rawValue: 8932, sub: '+521 this month' },
    { label: 'Total Views', value: '145K', rawValue: 145000, sub: '+28K this month' },
    { label: 'Threads', value: '567', rawValue: 567, sub: '+42 this month' },
    { label: 'Engagement Rate', value: '3.1%', rawValue: 3.1, sub: '+0.4% vs last month' },
  ];
}

function getGrowthBase(pid: SocialPlatformId): number {
  const map: Record<SocialPlatformId, number> = {
    x: 9000,
    instagram: 24000,
    threads: 6250,
    tiktok: 39700,
    whatsapp: 1500,
  };
  return map[pid];
}

function getBarLabel(pid: SocialPlatformId): string {
  if (pid === 'whatsapp') return 'Messages';
  return 'Engagement';
}

function getBarUnit(pid: SocialPlatformId): string {
  if (pid === 'whatsapp') return 'messages';
  if (pid === 'tiktok') return 'sec';
  return 'engagements';
}

function getGrowthTitle(pid: SocialPlatformId): string {
  if (pid === 'whatsapp') return 'Messages Over Time';
  return 'Follower Growth';
}

function getTopPostsTitle(pid: SocialPlatformId): string {
  if (pid === 'whatsapp') return 'Recent Broadcasts';
  return 'Top Performing Posts';
}

export function getDummyData(platformId: SocialPlatformId): PlatformDummyData {
  const platformIdx = PLATFORM_KEYS.indexOf(platformId);
  const posts = POSTS_BY_PLATFORM[platformId];

  return {
    stats: buildStats(platformId),
    growth: generateGrowth(getGrowthBase(platformId), 365, platformIdx),
    barWeekly: generateBarWeekly(platformIdx),
    barMonthly: generateBarMonthly(platformIdx),
    barYearly: generateBarYearly(platformIdx),
    barLabel: getBarLabel(platformId),
    barUnit: getBarUnit(platformId),
    topPosts: posts.map((p, i) => ({
      title: p.title,
      likes: deterministicValue(platformIdx, i * 7, 45000, 300),
      date: new Date(Date.now() - i * 4 * 86400000).toISOString().slice(0, 10),
      metric: p.metric,
    })),
    topPostsTitle: getTopPostsTitle(platformId),
  };
}
