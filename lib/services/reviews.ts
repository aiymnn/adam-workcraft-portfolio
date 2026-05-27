export interface ReviewMedia {
  src: string;
  type: 'image' | 'video';
}

export interface AdminReview {
  id: string;
  author: string;
  role: string;
  quote: string;
  collection: ReviewMedia[];
}

const STORAGE_KEY = 'admin_reviews';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function seedData(): AdminReview[] {
  return [
    {
      id: 'review-1',
      author: 'Sarah & James',
      role: 'Wedding, 2025',
      quote: 'Adam captured our wedding day with such grace. Every photo feels like a frame from a film — warm, honest, and utterly timeless.',
      collection: [
        { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
        { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200', type: 'image' },
        { src: '/video-dummy.mp4', type: 'video' },
      ],
    },
    {
      id: 'review-2',
      author: 'Maya Rahman',
      role: 'Fashion Editor',
      quote: 'The attention to detail is unmatched. He saw moments we didn\'t even notice happening, and turned them into art.',
      collection: [
        { src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200', type: 'image' },
        { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200', type: 'image' },
        { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
      ],
    },
    {
      id: 'review-3',
      author: 'Daniel & Priya',
      role: 'Engagement, 2025',
      quote: 'We\'ve never felt so comfortable in front of a camera. The results were absolutely stunning, like a love letter to our story.',
      collection: [],
    },
    {
      id: 'review-4',
      author: 'The Windsor Estate',
      role: 'Corporate Event',
      quote: 'Professional, unobtrusive, and incredibly talented. Our gallery tells the whole story without saying a word.',
      collection: [
        { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
        { src: '/video-dummy.mp4', type: 'video' },
      ],
    },
  ];
}

export function loadReviews(): AdminReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminReview[];
  } catch {}
  const seeds = seedData();
  saveReviews(seeds);
  return seeds;
}

export function saveReviews(reviews: AdminReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}
