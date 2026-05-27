export interface VaultCollection {
  id: string;
  title: string;
  category: 'Photography' | 'Videography';
  thumb: string;
  media: string[];
  isVideo?: boolean;
  videoUrl?: string;
  columnSpan: number;
  rowSpan: number;
  order: number;
}

const STORAGE_KEY = 'admin_vault';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function seedData(): VaultCollection[] {
  return [
    {
      id: 'vault-1',
      title: 'The Minimalist Wedding',
      category: 'Photography',
      thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000',
      media: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
      ],
      columnSpan: 1,
      rowSpan: 2,
      order: 0,
    },
    {
      id: 'vault-2',
      title: 'Kuala Lumpur Fashion Week',
      category: 'Videography',
      thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
      media: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200'],
      isVideo: true,
      videoUrl: '/video-dummy.mp4',
      columnSpan: 1,
      rowSpan: 1,
      order: 1,
    },
    {
      id: 'vault-3',
      title: 'Windsor Estate Gala',
      category: 'Photography',
      thumb: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000',
      media: [
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
      ],
      columnSpan: 1,
      rowSpan: 1,
      order: 2,
    },
    {
      id: 'vault-4',
      title: 'Moments in Monochrome',
      category: 'Videography',
      thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
      media: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200'],
      isVideo: true,
      videoUrl: '/video-dummy.mp4',
      columnSpan: 1,
      rowSpan: 1,
      order: 3,
    },
    {
      id: 'vault-5',
      title: 'Golden Hour Ceremony',
      category: 'Photography',
      thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000',
      media: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
      ],
      columnSpan: 1,
      rowSpan: 1,
      order: 4,
    },
    {
      id: 'vault-6',
      title: 'Tech Summit Keynote',
      category: 'Photography',
      thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
      media: [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
      ],
      columnSpan: 2,
      rowSpan: 1,
      order: 5,
    },
  ];
}

export function loadVaultCollections(): VaultCollection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as VaultCollection[];
  } catch {}
  const seeds = seedData();
  saveVaultCollections(seeds);
  return seeds;
}

export function saveVaultCollections(collections: VaultCollection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch {}
}
