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
  isActive?: boolean;
  collection: PublicReviewMedia[];
}

export interface PublicSocialLinks {
  x: string;
  instagram: string;
  threads: string;
  tiktok: string;
  whatsapp: string;
}

export interface PublicSocialLinksVisibility {
  x: boolean;
  instagram: boolean;
  threads: boolean;
  tiktok: boolean;
  whatsapp: boolean;
}

export interface PublicAdminProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface PublicContactMessageInput {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface AdminContactMessageItem {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}



export interface StoryLoopImagePublicItem {
  id: string;
  name: string;
  src: string;
  order: number;
}
