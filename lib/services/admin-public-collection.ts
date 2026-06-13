export interface PublicCollectionItem {
  id: string;
  title: string | null;
  src: string;
  type: 'image' | 'video';
  section: 'about' | 'expertise' | 'hero';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export async function fetchAdminPublicCollection(section?: string): Promise<PublicCollectionItem[]> {
  const url = section ? `/api/admin/public-collection?section=${encodeURIComponent(section)}` : '/api/admin/public-collection';
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch public collection');
  return data.items;
}

export async function createAdminPublicCollectionItem(payload: {
  title?: string;
  src: string;
  type: 'image' | 'video';
  section: 'about' | 'expertise' | 'hero';
  order?: number;
}): Promise<PublicCollectionItem> {
  const res = await fetch('/api/admin/public-collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create item');
  return data.item;
}

export async function updateAdminPublicCollectionItem(
  id: string,
  payload: { title?: string; src?: string; type?: 'image' | 'video'; section?: 'about' | 'expertise' | 'hero'; order?: number; isActive?: boolean },
): Promise<PublicCollectionItem> {
  const res = await fetch(`/api/admin/public-collection/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update item');
  return data.item;
}

export async function deleteAdminPublicCollectionItem(id: string): Promise<void> {
  const res = await fetch(`/api/admin/public-collection/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete item');
}

export async function reorderAdminPublicCollection(items: { id: string; sortOrder: number }[]): Promise<void> {
  const res = await fetch('/api/admin/public-collection/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to reorder items');
}
