import type { PublicAdminProfile, PublicReviewItem, PublicSocialLinks, PublicVaultCollection, StoryLoopImagePublicItem } from '@/types/content';

interface VaultResponse {
  success?: boolean;
  collections?: PublicVaultCollection[];
}

interface ReviewResponse {
  success?: boolean;
  reviews?: PublicReviewItem[];
}

interface SocialLinksResponse {
  success?: boolean;
  links?: PublicSocialLinks;
}

interface StoryLoopImageResponse {
  success?: boolean;
  logos?: StoryLoopImagePublicItem[];
}

interface AdminProfileResponse {
  success?: boolean;
  profile?: PublicAdminProfile;
}

export async function fetchPublicVaultCollections(limit = 6): Promise<PublicVaultCollection[]> {
  try {
    const res = await fetch(`/api/public/vault?limit=${limit}`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as VaultResponse;
    return data.collections || [];
  } catch {
    return [];
  }
}

export async function fetchPublicReviews(limit = 6): Promise<PublicReviewItem[]> {
  try {
    const res = await fetch(`/api/public/reviews?limit=${limit}`, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as ReviewResponse;
    return data.reviews || [];
  } catch {
    return [];
  }
}

export async function fetchPublicSocialLinks(): Promise<PublicSocialLinks> {
  try {
    const res = await fetch('/api/public/social-links', { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
    const data = (await res.json()) as SocialLinksResponse;
    return data.links || { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
  } catch {
    return { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
  }
}

export async function fetchPublicAdminProfile(): Promise<PublicAdminProfile> {
  try {
    const res = await fetch('/api/public/profile', { method: 'GET', cache: 'no-store' });
    if (!res.ok) return { name: 'Adam Workcraft', email: 'hello@adamworkcraft.com', avatarUrl: '/person-2.png' };
    const data = (await res.json()) as AdminProfileResponse;
    return data.profile || { name: 'Adam Workcraft', email: 'hello@adamworkcraft.com', avatarUrl: '/person-2.png' };
  } catch {
    return { name: 'Adam Workcraft', email: 'hello@adamworkcraft.com', avatarUrl: '/person-2.png' };
  }
}

export async function fetchPublicStoryLoopImages(): Promise<StoryLoopImagePublicItem[]> {
  try {
    const res = await fetch('/api/public/story-loop-logos', { method: 'GET', cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as StoryLoopImageResponse;
    return data.logos || [];
  } catch {
    return [];
  }
}
