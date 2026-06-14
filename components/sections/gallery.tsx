'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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

const UNIFORM_LAYOUT_CLASS = 'shrink-0 h-[400px] md:h-[500px] lg:h-[600px] w-[85vw] md:w-[400px] lg:w-[450px]';

function getLayoutClass(): string {
  return UNIFORM_LAYOUT_CLASS;
}

export interface GalleryProps {
  initialVaultCollections: any[];
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
  
  const isVideoCard = item.category === 'Videography' && videoSources.length > 0;

  const catLabel = (cat: string) => {
    if (cat === 'Photography') return t.gallery.photography || 'Photography';
    if (cat === 'Videography') return t.gallery.videography || 'Videography';
    return cat;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (isVideoCard) {
          const el = activeRef.current === 'a' ? videoARef.current : videoBRef.current;
          if (entry.isIntersecting) {
            el?.play().catch(() => { });
          } else {
            el?.pause();
          }
        }
      },
      { threshold: 0.3 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideoCard]);

  useEffect(() => {
    if (isVideoCard || images.length <= 1) return;

    intervalRef.current = setInterval(() => {
      if (visibleRef.current && !hoverRef.current) {
        const next = (idxRef.current + 1) % images.length;
        setOutgoingSrc(images[idxRef.current]);
        idxRef.current = next;
        setCurrentSrc(images[next]);
      }
    }, 2000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isVideoCard, images]);

  useEffect(() => {
    if (!isVideoCard || !videoSources.length) return;

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
        videoARef.current?.play().catch(() => { });
      }
    };
    init();
  }, [isVideoCard, videoSources]);

  useEffect(() => {
    if (!isVideoCard || videoSources.length <= 1) return;

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
      toEl.play().catch(() => { });

      gsap.to(fromEl, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(toEl, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });

      videoIdxRef.current = nextIdx;
      activeRef.current = isAActive ? 'b' : 'a';
    }, 15000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isVideoCard, videoSources]);

  useEffect(() => {
    if (!outgoingSrc) return;
    const timer = setTimeout(() => setOutgoingSrc(null), 500);
    return () => clearTimeout(timer);
  }, [outgoingSrc]);

  const cursorRef = useRef<HTMLDivElement>(null);
  const xTo = useRef<((value: number) => void) | null>(null);
  const yTo = useRef<((value: number) => void) | null>(null);

  useEffect(() => {
    if (cursorRef.current) {
      xTo.current = gsap.quickTo(cursorRef.current, 'x', { duration: 0.4, ease: 'power3' });
      yTo.current = gsap.quickTo(cursorRef.current, 'y', { duration: 0.4, ease: 'power3' });
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    if (xTo.current && yTo.current) {
      xTo.current(e.clientX - rect.left);
      yTo.current(e.clientY - rect.top);
    }

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.5
    });
  };

  const handleMouseEnter = () => {
    hoverRef.current = true;
    if (cursorRef.current) {
      gsap.to(cursorRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
    }
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;
    if (cursorRef.current) {
      gsap.to(cursorRef.current, { scale: 0, opacity: 0, duration: 0.3 });
    }
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.8
      });
    }
  };

  const handleClick = () => onOpenCollection(item);

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`group relative flex cursor-pointer items-end overflow-hidden rounded-3xl border border-white/10 bg-stone-900/40 p-6 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] md:p-8 ${layoutClass} group-hover/gallery:opacity-40 group-hover/gallery:blur-[2px] hover:!opacity-100 hover:!blur-none hover:z-20`}
      style={{ touchAction: 'manipulation', transformStyle: 'preserve-3d' }}
    >
      {isVideoCard ? (
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
              key={`outgoing-${outgoingSrc}`}
              src={outgoingSrc}
              alt=""
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="absolute inset-0 size-full object-cover animate-[fadeOut_0.5s_ease-out_forwards]"
            />
          )}
          <img
            key={`current-${currentSrc}`}
            src={currentSrc}
            alt={item.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 animate-[fadeIn_0.5s_ease-out]"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Magnetic Cursor */}
      <div
        ref={cursorRef}
        className="pointer-events-none absolute left-0 top-0 z-50 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500/90 text-[10px] font-bold tracking-[0.2em] text-black opacity-0 shadow-xl backdrop-blur-md"
        style={{ transform: 'scale(0)' }}
      >
        {isVideoCard ? 'PLAY' : 'VIEW'}
      </div>

      <div className="relative z-10 translate-y-4 transition-transform duration-500 group-hover:translate-y-0" style={{ transform: 'translateZ(30px)' }}>
        <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-white backdrop-blur-md transition-colors duration-300 group-hover:border-amber-500/50 group-hover:bg-amber-500/20 group-hover:text-amber-200">
          {catLabel(item.category)}
        </span>
        <h3 className="text-xl font-bold text-white transition-colors duration-300 md:text-2xl lg:text-3xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {item.title}
        </h3>
      </div>
    </div>
  );
}

export default function Gallery({ initialVaultCollections, onOpenCollection, onInitialDataReady }: GalleryProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const collections = useMemo(() => {
    return initialVaultCollections.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      thumb: item.thumb,
      media: item.media,
      isVideo: item.isVideo,
      videos: item.videos,
      columnSpan: item.columnSpan,
      rowSpan: item.rowSpan,
    }));
  }, [initialVaultCollections]);

  const TABS = useMemo(() => {
    const uniqueCats = Array.from(new Set(collections.map(c => c.category)));
    
    const dynamicTabs = uniqueCats.map(cat => {
      let label = cat;
      if (cat === 'Photography') label = t.gallery.photography || 'Photography';
      if (cat === 'Videography') label = t.gallery.videography || 'Videography';
      return { id: cat, label };
    });

    return [
      { id: 'All', label: t.gallery.all || 'All Work' },
      ...dynamicTabs
    ];
  }, [collections, t.gallery]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [displayCategory, setDisplayCategory] = useState('All');
  const isInitialLoad = useRef(true);

  useEffect(() => {
    onInitialDataReady?.();
  }, [onInitialDataReady]);

  useEffect(() => {
    if (activeCategory === displayCategory) return;

    const ctx = gsap.context(() => {
      if (!containerRef.current) return;
      const items = Array.from(containerRef.current.children) as HTMLElement[];
      const visibleItems = items.filter(el => el.style.display !== 'none');

      gsap.to(visibleItems, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        onComplete: () => {
          setDisplayCategory(activeCategory);
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [activeCategory, displayCategory]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;
      const items = Array.from(containerRef.current.children) as HTMLElement[];

      items.forEach(el => {
        const cat = el.getAttribute('data-category');
        el.style.display = (displayCategory === 'All' || cat === displayCategory) ? '' : 'none';
      });

      const visibleItems = items.filter(el => el.style.display !== 'none');

      if (visibleItems.length === 0) return;

      if (isInitialLoad.current) {
        gsap.fromTo(
          visibleItems,
          { y: 40, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          },
        );
        isInitialLoad.current = false;
      } else {
        gsap.fromTo(
          visibleItems,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [displayCategory, collections]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Check if predominantly vertical scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;

        if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="bg-black/40 px-6 py-16 text-[var(--text)] md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:mb-12 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl md:mb-4 md:text-6xl lg:text-7xl">
              {t.gallery.title}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
              {t.gallery.subtitle}
            </p>
          </div>

          <div className="flex w-full overflow-x-auto rounded-full border border-white/5 bg-stone-900/40 p-1.5 scrollbar-hide md:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 md:text-sm ${
                  activeCategory === tab.id
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="mb-6 flex items-center justify-end md:hidden">
          <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-amber-500/80 animate-pulse">
            Swipe to explore
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .desktop-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .desktop-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-inline: 20px;
          }
          .desktop-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          .desktop-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(245, 158, 11, 0.5);
          }
          @media (max-width: 768px) {
            .desktop-scrollbar::-webkit-scrollbar {
              display: none;
            }
          }
        `}} />

        <div ref={containerRef} className="desktop-scrollbar group/gallery flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 scroll-smooth">
          {collections.map((item) => (
            <div
              key={item.id}
              data-category={item.category}
              className="snap-start h-full shrink-0"
            >
              <GalleryCard
                item={item}
                onOpenCollection={onOpenCollection}
                layoutClass={getLayoutClass()}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
