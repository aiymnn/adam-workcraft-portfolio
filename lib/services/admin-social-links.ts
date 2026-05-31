import type { PublicSocialLinks, PublicSocialLinksVisibility } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  links?: PublicSocialLinks;
  visibility?: PublicSocialLinksVisibility;
}

async function parseResponse(res: Response): Promise<ApiResponse> {
  try {
    return (await res.json()) as ApiResponse;
  } catch {
    return {};
  }
}

async function assertOk(res: Response): Promise<ApiResponse> {
  const payload = await parseResponse(res);
  if (!res.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

export async function fetchAdminSocialLinks(): Promise<PublicSocialLinks> {
  const res = await fetch('/api/admin/social-links', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.links || { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
}

export async function fetchAdminSocialLinkVisibility(): Promise<PublicSocialLinksVisibility> {
  const res = await fetch('/api/admin/social-links', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.visibility || { x: true, instagram: true, threads: true, tiktok: true, whatsapp: true };
}

export async function saveAdminSocialLinks(
  links: PublicSocialLinks,
  visibility: PublicSocialLinksVisibility,
): Promise<{ links: PublicSocialLinks; visibility: PublicSocialLinksVisibility }> {
  const res = await fetch('/api/admin/social-links', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ links, visibility }),
  });
  const data = await assertOk(res);
  return {
    links: data.links || links,
    visibility: data.visibility || visibility,
  };
}
