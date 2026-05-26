export interface StatCard {
  label: string;
  value: string;
  sub: string;
}

export interface GrowthPoint {
  date: string;
  value: number;
}

export interface TopPost {
  title: string;
  likes: number;
  date: string;
  metric: string;
}

export interface PlatformDummyData {
  stats: StatCard[];
  growth: GrowthPoint[];
  barWeekly: number[];
  barMonthly: number[];
  barYearly: number[];
  barLabel: string;
  barUnit: string;
  topPosts: TopPost[];
  topPostsTitle: string;
}
