export interface PublicVaultCollection {
  id: string;
  title: string;
  category: string;
  thumb: string;
  media: string[];
  isVideo: boolean;
  videos: string[];
  columnSpan: number;
  rowSpan: number;
  order: number;
}

export interface PublicReviewMedia {
  src: string;
  type: 'image' | 'video';
}

export interface PublicReviewItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  collection: PublicReviewMedia[];
}

export interface PublicSocialLinks {
  x: string;
  instagram: string;
  threads: string;
  tiktok: string;
  whatsapp: string;
}

export interface VaultCategoryItem {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  usageCount?: number;
}
