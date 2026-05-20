'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguageTheme } from '@/context/language-theme-context';

gsap.registerPlugin(ScrollTrigger);

export interface CollectionItem {
  id: string;
  title: string;
  category: string;
  thumb: string;
  media: string[];
  isVideo?: boolean;
  videoUrl?: string;
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
    videoUrl: '/video-dummy.mp4',
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
    videoUrl: '/video-dummy.mp4',
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
  'lg:col-span-1 lg:row-span-2', // 0 - tall left
  '',                              // 1 - normal
  '',                              // 2 - normal
  '',                              // 3 - normal
  '',                              // 4 - normal
  'lg:col-span-3',                 // 5 - full width banner
];

interface GalleryProps {
  onOpenCollection: (collection: CollectionItem) => void;
}

function GalleryCard({ item, onOpenCollection, layoutClass }: { item: CollectionItem; onOpenCollection: (c: CollectionItem) => void; layoutClass: string }) {
  const { t } = useLanguageTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const images = !item.isVideo ? [item.thumb, ...item.media] : [item.thumb];
  const [currentSrc, setCurrentSrc] = useState(images[0] || '');
  const [outgoingSrc, setOutgoingSrc] = useState<string | null>(null);
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(false);
  const hoverRef = useRef(false);

  const catLabel = (cat: string) => cat === 'Photography' ? t.gallery.photography : t.gallery.videography;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (item.isVideo && videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
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
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          src={item.videoUrl}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          {outgoingSrc && (
            <img
              key={outgoingSrc}
              src={outgoingSrc}
              alt=""
              className="absolute inset-0 size-full object-cover animate-[fadeOut_0.5s_ease-out_forwards]"
            />
          )}
          <img
            key={currentSrc}
            src={currentSrc}
            alt={item.title}
            loading="lazy"
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

export default function Gallery({ onOpenCollection }: GalleryProps) {
  const { t } = useLanguageTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          {COLLECTIONS.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              onOpenCollection={onOpenCollection}
              layoutClass={LAYOUT_CLASSES[i] || ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
