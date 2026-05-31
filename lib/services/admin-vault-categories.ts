import type { VaultCategoryItem } from '@/types/content';

interface ApiResponse {
  success?: boolean;
  message?: string;
  category?: VaultCategoryItem;
  categories?: VaultCategoryItem[];
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

export async function fetchAdminVaultCategories(): Promise<VaultCategoryItem[]> {
  const res = await fetch('/api/admin/vault-categories', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk(res);
  return data.categories || [];
}

export async function createAdminVaultCategory(name: string): Promise<VaultCategoryItem> {
  const res = await fetch('/api/admin/vault-categories', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await assertOk(res);
  if (!data.category) throw new Error('Category missing in response');
  return data.category;
}

export async function updateAdminVaultCategory(id: string, name: string): Promise<VaultCategoryItem> {
  const res = await fetch(`/api/admin/vault-categories/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await assertOk(res);
  if (!data.category) throw new Error('Category missing in response');
  return data.category;
}

export async function deleteAdminVaultCategory(id: string): Promise<void> {
  const res = await fetch(`/api/admin/vault-categories/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  await assertOk(res);
}
