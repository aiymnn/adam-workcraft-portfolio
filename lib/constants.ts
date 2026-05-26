export const SERVICES = [
  'Brand Consultation',
  'UI/UX Design Review',
  'Website Strategy',
  'Photography Session',
  'Social Media Audit',
  'Content Writing',
  'Other',
] as const;

export const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  pending: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/50',
};

export const STATUS_HOVER: Record<string, string> = {
  confirmed: 'hover:bg-emerald-800/60',
  pending: 'hover:bg-amber-800/60',
  cancelled: 'hover:bg-red-800/60',
};

export const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-300',
  confirmed: 'bg-emerald-900/40 text-emerald-300',
  cancelled: 'bg-red-900/40 text-red-300',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export const SOCIAL_PLATFORMS = [
  { id: 'x', label: 'X (Twitter)', icon: 'X' },
  { id: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { id: 'threads', label: 'Threads', icon: 'Threads' },
  { id: 'tiktok', label: 'TikTok', icon: 'TikTok' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'WhatsApp' },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]['id'];

export const SOCIAL_LINKS_STORAGE_KEY = 'admin_social_links';

export function loadSocialLinks(): Record<SocialPlatformId, string> {
  if (typeof window === 'undefined') {
    return { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
  }
  try {
    const raw = localStorage.getItem(SOCIAL_LINKS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<SocialPlatformId, string>;
  } catch {}
  return { x: '', instagram: '', threads: '', tiktok: '', whatsapp: '' };
}

export function saveSocialLinks(links: Record<SocialPlatformId, string>) {
  try {
    localStorage.setItem(SOCIAL_LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch {}
}

export const PROFILE_STORAGE_KEY = 'admin_profile';

export function loadProfile() {
  if (typeof window === 'undefined') {
    return { name: 'Adam Workcraft', email: 'hello@adamworkcraft.com' };
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { name: string; email: string };
  } catch {}
  return { name: 'Adam Workcraft', email: 'hello@adamworkcraft.com' };
}

export function saveProfile(profile: { name: string; email: string }) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}
