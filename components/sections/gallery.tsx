'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/language-context';
import { fetchPublicVaultCollections } from '@/lib/services/public-content';

gsap.registerPlugin(ScrollTrigger);

export interface CollectionItem {
  id: string;
  title: string;
  category: string;
  thumb: string;
  media: string[];
  isVideo?: boolean;
  videos?: string[];
  columnSpan?: number;
  rowSpan?: number;
}

const COLLECTIONS: CollectionItem[] = [
  {
    id: 'wedding-1',
    title: 'The Minimalist Wedding',
    category: 'Photography',
    thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000',
    media: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
    ],
  },
  {
    id: 'event-video',
    title: 'Kuala Lumpur Fashion Week',
    category: 'Videography',
    thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
    media: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200'],
    isVideo: true,
    videos: ['/video-dummy.mp4', '/video-dummy.mp4'],
  },
  {
    id: 'corporate-1',
    title: 'Windsor Estate Gala',
    category: 'Photography',
    thumb: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000',
    media: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
    ],
  },
  {
    id: 'short-film-1',
    title: 'Moments in Monochrome',
    category: 'Videography',
    thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
    media: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200'],
    isVideo: true,
    videos: ['/video-dummy.mp4', '/video-dummy.mp4', '/video-dummy.mp4'],
  },
  {
    id: 'wedding-2',
    title: 'Golden Hour Ceremony',
    category: 'Photography',
    thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000',
    media: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
    ],
  },
  {
    id: 'corporate-2',
    title: 'Tech Summit Keynote',
    category: 'Photography',
    thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000',
    media: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
    ],
  },
];

const LAYOUT_CLASSES = [
  'md:row-span-2 lg:col-span-1 lg:row-span-2', // 0 - tall
  '',                                            // 1
  '',                                            // 2
  '',                                            // 3
  '',                                            // 4
  'md:col-span-2 lg:col-span-3',                 // 5 - full width
];

function getLayoutClass(item: CollectionItem, index: number): string {
  if (typeof item.columnSpan === 'number' || typeof item.rowSpan === 'number') {
    const classes: string[] = [];

    if (item.rowSpan === 2) {
      classes.push('md:row-span-2');
    }

    if (item.columnSpan === 2) {
      classes.push('md:col-span-2 lg:col-span-2');
    }

    if (item.columnSpan === 3) {
      classes.push('md:col-span-2 lg:col-span-3');
    }

    return classes.join(' ');
  }

  return LAYOUT_CLASSES[index] || '';
}

interface GalleryProps {
  onOpenCollection: (collection: CollectionItem) => void;
  onInitialDataReady?: () => void;
}

function GalleryCard({ item, onOpenCollection, layoutClass }: { item: CollectionItem; onOpenCollection: (c: CollectionItem) => void; layoutClass: string }) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const images = !item.isVideo ? [item.thumb, ...item.media] : [item.thumb];
  const [currentSrc, setCurrentSrc] = useState(images[0] || '');
  const [outgoingSrc, setOutgoingSrc] = useState<string | null>(null);
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(false);
  const hoverRef = useRef(false);

  const videoSources = item.videos ?? [];
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<'a' | 'b'>('a');
  const videoIdxRef = useRef(0);

  const catLabel = (cat: string) => cat === 'Photography' ? t.gallery.photography : t.gallery.videography;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (item.isVideo) {
          const el = activeRef.current === 'a' ? videoARef.current : videoBRef.current;
          if (entry.isIntersecting) {
            el?.play().catch(() => {});
          } else {
            el?.pause();
          }
        }
      },
      { threshold: 0.3 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [item.isVideo]);

  useEffect(() => {
    if (item.isVideo || images.length <= 1) return;

    intervalRef.current = setInterval(() => {
      if (visibleRef.current && !hoverRef.current) {
        const next = (idxRef.current + 1) % images.length;
        setOutgoingSrc(images[idxRef.current]);
        idxRef.current = next;
        setCurrentSrc(images[next]);
      }
    }, 2000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [item.isVideo, images]);

  useEffect(() => {
    if (!item.isVideo || !videoSources.length) return;

    const init = () => {
      if (videoARef.current) {
        videoARef.current.src = videoSources[0];
        videoARef.current.load();
      }
      if (videoBRef.current) {
        videoBRef.current.src = videoSources[videoSources.length > 1 ? 1 : 0];
      }
      videoIdxRef.current = 0;
      activeRef.current = 'a';
      gsap.set(videoARef.current, { opacity: 1 });
      gsap.set(videoBRef.current, { opacity: 0 });
      if (visibleRef.current) {
        videoARef.current?.play().catch(() => {});
      }
    };
    init();
  }, [item.isVideo, videoSources]);

  useEffect(() => {
    if (!item.isVideo || videoSources.length <= 1) return;

    intervalRef.current = setInterval(() => {
      if (!visibleRef.current || hoverRef.current) return;

      const nextIdx = (videoIdxRef.current + 1) % videoSources.length;
      const isAActive = activeRef.current === 'a';
      const fromEl = isAActive ? videoARef.current : videoBRef.current;
      const toEl = isAActive ? videoBRef.current : videoARef.current;
      if (!fromEl || !toEl) return;

      toEl.src = videoSources[nextIdx];
      toEl.load();
      toEl.currentTime = 0;
      toEl.play().catch(() => {});

      gsap.to(fromEl, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(toEl, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });

      videoIdxRef.current = nextIdx;
      activeRef.current = isAActive ? 'b' : 'a';
    }, 15000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [item.isVideo, videoSources]);

  useEffect(() => {
    if (!outgoingSrc) return;
    const timer = setTimeout(() => setOutgoingSrc(null), 500);
    return () => clearTimeout(timer);
  }, [outgoingSrc]);

  const handleMouseEnter = () => {
    hoverRef.current = true;
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
  };

  const handleClick = () => onOpenCollection(item);

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex min-h-64 cursor-pointer items-end overflow-hidden rounded-xl border border-[var(--border)] bg-stone-900 p-5 hover:border-[var(--button-hover)] md:min-h-72 md:p-6 ${layoutClass}`}
      style={{ touchAction: 'manipulation' }}
    >
      {item.isVideo ? (
        <div className="absolute inset-0">
          <video
            ref={videoARef}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full object-cover"
          />
          <video
            ref={videoBRef}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          {outgoingSrc && (
            <img
              key={outgoingSrc}
              src={outgoingSrc}
              alt=""
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 size-full object-cover animate-[fadeOut_0.5s_ease-out_forwards]"
            />
          )}
          <img
            key={currentSrc}
            src={currentSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="absolute inset-0 size-full object-cover animate-[fadeIn_0.5s_ease-out]"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/90 via-[#0c0a09]/30 to-transparent" />
      {item.isVideo && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex size-14 items-center justify-center md:size-16">
            <div className="relative flex size-full items-center justify-center rounded-full border border-stone-100/30 bg-stone-100/10 backdrop-blur-md transition-transform group-hover:scale-110">
              <svg className="ml-1 size-5 text-white/80 md:size-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10">
        <span className="mb-1 block text-xs tracking-[0.2em] uppercase text-amber-200/60">
          {catLabel(item.category)}
        </span>
        <h3 className="text-base font-semibold text-[var(--text)] md:text-lg">
          {item.title}
        </h3>
      </div>
    </div>
  );
}

export default function Gallery({ onOpenCollection, onInitialDataReady }: GalleryProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] = useState<CollectionItem[]>(COLLECTIONS);

  useEffect(() => {
    let active = true;

    const loadCollections = async () => {
      try {
        const rows = await fetchPublicVaultCollections(8);
        if (!active || rows.length === 0) return;

        setCollections(
          rows.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            thumb: item.thumb,
            media: item.media,
            isVideo: item.isVideo,
            videos: item.videos,
            columnSpan: item.columnSpan,
            rowSpan: item.rowSpan,
          })),
        );
      } catch {
      } finally {
        if (active) {
          onInitialDataReady?.();
        }
      }
    };

    void loadCollections();
    return () => {
      active = false;
    };
  }, [onInitialDataReady]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;
      gsap.fromTo(
        containerRef.current.children,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 30%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="bg-black/40 px-6 py-16 text-[var(--text)] md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl md:mb-4 md:text-6xl lg:text-7xl">
          {t.gallery.title}
        </h2>
        <p className="mb-12 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] md:mb-16 md:text-base">
          {t.gallery.subtitle}
        </p>

        <div ref={containerRef} className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {collections.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              onOpenCollection={onOpenCollection}
              layoutClass={getLayoutClass(item, i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
