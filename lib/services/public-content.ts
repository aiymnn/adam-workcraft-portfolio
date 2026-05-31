import type { PublicReviewItem, PublicSocialLinks, PublicVaultCollection } from '@/types/content';

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
