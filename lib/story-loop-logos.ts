import type { StoryLoopImagePublicItem } from '@/types/content';

export interface StoryLoopRenderableLogo {
  name: string;
  src: string;
}

export interface StoryLoopImagesSettings {
  randomizeOrder: boolean;
}

export const MIN_STORY_LOOP_LOGOS = 12;
export const STORY_LOOP_IMAGES_SETTINGS_KEY = 'story_loop_images_settings';
export const DEFAULT_STORY_LOOP_IMAGES_SETTINGS: StoryLoopImagesSettings = {
  randomizeOrder: true,
};

export const DEFAULT_STORY_LOOP_LOGOS: StoryLoopRenderableLogo[] = [
  { name: 'Photoshop', src: '/photoshop-logo.png' },
  { name: 'Lightroom', src: '/photoshop-logo.png' },
  { name: 'Premiere Pro', src: '/photoshop-logo.png' },
  { name: 'After Effects', src: '/photoshop-logo.png' },
  { name: 'Illustrator', src: '/photoshop-logo.png' },
  { name: 'DaVinci Resolve', src: '/photoshop-logo.png' },
  { name: 'Final Cut Pro', src: '/photoshop-logo.png' },
  { name: 'Canva', src: '/photoshop-logo.png' },
  { name: 'CapCut', src: '/photoshop-logo.png' },
  { name: 'Blender', src: '/photoshop-logo.png' },
  { name: 'Figma', src: '/photoshop-logo.png' },
  { name: 'Audition', src: '/photoshop-logo.png' },
  { name: 'Capture One', src: '/photoshop-logo.png' },
  { name: 'Pro Tools', src: '/photoshop-logo.png' },
  { name: 'Logic Pro', src: '/photoshop-logo.png' },
  { name: 'Unity', src: '/photoshop-logo.png' },
  { name: 'Maya', src: '/photoshop-logo.png' },
  { name: 'Cinema 4D', src: '/photoshop-logo.png' },
  { name: 'CorelDRAW', src: '/photoshop-logo.png' },
  { name: 'Sketch', src: '/photoshop-logo.png' },
  { name: 'Affinity', src: '/photoshop-logo.png' },
  { name: 'Luminar', src: '/photoshop-logo.png' },
  { name: 'Photomatix', src: '/photoshop-logo.png' },
  { name: 'Houdini', src: '/photoshop-logo.png' },
];

export function isStoryLoopFallbackActive(logosCount: number): boolean {
  return logosCount < MIN_STORY_LOOP_LOGOS;
}

export function toRenderableStoryLoopLogos(logos: StoryLoopImagePublicItem[]): StoryLoopRenderableLogo[] {
  if (isStoryLoopFallbackActive(logos.length)) {
    return DEFAULT_STORY_LOOP_LOGOS;
  }

  return logos.map((logo) => ({
    name: logo.name,
    src: logo.src,
  }));
}

export function shuffleStoryLoopItems<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}