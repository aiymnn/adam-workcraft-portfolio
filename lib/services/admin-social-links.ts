import type { PublicSocialLinks } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  links?: PublicSocialLinks;
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

export async function saveAdminSocialLinks(links: PublicSocialLinks): Promise<PublicSocialLinks> {
  const res = await fetch('/api/admin/social-links', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ links }),
  });
  const data = await assertOk(res);
  return data.links || links;
}
