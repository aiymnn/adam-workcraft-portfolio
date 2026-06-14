'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/language-context';
import { fetchPublicReviews } from '@/lib/services/public-content';

gsap.registerPlugin(ScrollTrigger);

interface ReviewMedia {
  src: string;
  type: 'image' | 'video';
}

interface ReviewItem {
  quote: string;
  author: string;
  role: string;
  collection?: ReviewMedia[];
}

const REVIEWS: ReviewItem[] = [
  { quote: 'Adam captured our wedding day with such grace. Every photo feels like a frame from a film — warm, honest, and utterly timeless.', author: 'Sarah & James', role: 'Wedding, 2025', collection: [
    { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200', type: 'image' },
    { src: '/video-dummy.mp4', type: 'video' },
  ]},
  { quote: 'The attention to detail is unmatched. He saw moments we didn\'t even notice happening, and turned them into art.', author: 'Maya Rahman', role: 'Fashion Editor', collection: [
    { src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200', type: 'image' },
    { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
  ]},
  { quote: 'We\'ve never felt so comfortable in front of a camera. The results were absolutely stunning, like a love letter to our story.', author: 'Daniel & Priya', role: 'Engagement, 2025' },
  { quote: 'Professional, unobtrusive, and incredibly talented. Our gallery tells the whole story without saying a word.', author: 'The Windsor Estate', role: 'Corporate Event', collection: [
    { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200', type: 'image' },
    { src: '/video-dummy.mp4', type: 'video' },
  ]},
];

function ReviewLightbox({ items, index, onClose, onIndexChange }: { items: ReviewMedia[]; index: number; onClose: () => void; onIndexChange: (i: number) => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(index);
  const [outgoing, setOutgoing] = useState<ReviewMedia | null>(null);
  const [current, setCurrent] = useState(items[index]);

  useEffect(() => {
    if (index === prevIndexRef.current) return;
    setOutgoing(current);
    prevIndexRef.current = index;
    setCurrent(items[index]);
  }, [index, items, current]);

  useEffect(() => {
    if (!outgoing) return;
    const timer = setTimeout(() => setOutgoing(null), 400);
    return () => clearTimeout(timer);
  }, [outgoing]);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;
    document.body.style.overflow = 'hidden';
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(panelRef.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' });
    });
    return () => { ctx.revert(); document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    if (!overlayRef.current || !panelRef.current) return;
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(panelRef.current, { scale: 0.92, opacity: 0, duration: 0.2, onComplete: onClose });
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') onIndexChange(index > 0 ? index - 1 : items.length - 1);
      if (e.key === 'ArrowRight') onIndexChange(index < items.length - 1 ? index + 1 : 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose, index, items.length, onIndexChange]);

  const handleFullscreen = () => {
    const el = mediaWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  const showNav = items.length > 1;

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="relative flex max-h-[80vh] max-w-2xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute -right-3 -top-3 z-20 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-sm text-[var(--text)] md:size-9"
        >
          &#x2715;
        </button>

        <div ref={mediaWrapRef} className="relative w-full">
          {outgoing && (
            <div className="absolute inset-0 z-10 animate-[fadeOut_0.4s_ease-out_forwards]">
              {outgoing.type === 'video' ? (
                <div className="aspect-video">
                  <video src={outgoing.src} muted className="size-full rounded-lg object-cover" />
                </div>
              ) : (
                <Image
                  src={outgoing.src}
                  alt=""
                  width={1600}
                  height={1000}
                  unoptimized
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              )}
            </div>
          )}
          <div key={`${current.src}-${index}`} className="animate-[fadeIn_0.4s_ease-out]">
            {current.type === 'video' ? (
              <div className="aspect-video">
                <video
                  src={current.src}
                  controls
                  muted
                  className="size-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <Image
                src={current.src}
                alt=""
                width={1600}
                height={1000}
                unoptimized
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            )}
            {(current.type === 'video') && (
              <span className="absolute right-10 top-3 z-10 rounded bg-black/60 px-2 py-0.5 text-xs text-white/80">
                Video
              </span>
            )}
          </div>

          <button
            onClick={handleFullscreen}
            className="absolute bottom-3 right-3 z-10 flex size-7 items-center justify-center rounded border border-[var(--border)] bg-black/60 text-[var(--text-muted)] transition-colors hover:text-white md:size-8"
            title="Fullscreen"
          >
            <svg className="size-3.5 md:size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V3m0 0h5M3 3l6 6m12 0V3m0 0h-5m5 0l-6 6M3 16v5m0 0h5m-5 0l6-6m12 5v-5m0 5h-5m5 0l-6-6" />
            </svg>
          </button>
        </div>

        {showNav && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onIndexChange(index > 0 ? index - 1 : items.length - 1)}
              className="flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] transition-colors hover:text-amber-200/80"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-[var(--text-dim)]">{index + 1} / {items.length}</span>
            <button
              onClick={() => onIndexChange(index < items.length - 1 ? index + 1 : 0)}
              className="flex size-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] transition-colors hover:text-amber-200/80"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

interface FeedbackProps {
  initialReviews: any[];
  onInitialDataReady?: () => void;
}

export default function Feedback({ initialReviews, onInitialDataReady }: FeedbackProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews.length > 0 ? initialReviews : REVIEWS);
  const [lightbox, setLightbox] = useState<{ items: ReviewMedia[]; index: number } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialReviews.length >= 3);

  useEffect(() => {
    onInitialDataReady?.();
  }, [onInitialDataReady]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll('.feedback-card');
      if (!cards || cards.length === 0) return;

      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'top 30%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const skip = reviews.length;
      const res = await fetch(`/api/public/reviews?skip=${skip}&take=3`);
      const data = await res.json();
      if (data.success && data.reviews.length > 0) {
        setReviews(prev => [...prev, ...data.reviews]);
        setHasMore(data.hasMore);
        
        // GSAP animate new cards
        requestAnimationFrame(() => {
          const allCards = sectionRef.current?.querySelectorAll('.feedback-card');
          if (allCards) {
            const newCards = Array.from(allCards).slice(skip);
            gsap.fromTo(
              newCards,
              { y: 60, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
            );
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more reviews', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="bg-[#1c1917]/60 px-6 py-16 text-[var(--text)] md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-3xl font-bold tracking-tight sm:text-4xl md:mb-16 md:text-5xl lg:text-6xl">
          {t.feedback.title}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-6">
          {reviews.map((item, i) => (
            <div
              key={i}
              className="feedback-card group relative flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md transition-colors hover:border-amber-500/20 hover:bg-white/[0.04] md:p-10"
              style={{ touchAction: 'manipulation' }}
            >
              <p className="text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-end justify-between md:mt-6">
                <div>
                  <p className="text-sm font-medium text-amber-200/80">
                    {item.author}
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">{item.role}</p>
                </div>
                {item.collection && (
                  <button
                    onClick={() => setLightbox({ items: item.collection!, index: 0 })}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] opacity-100 transition-all hover:border-amber-700/50 hover:text-amber-200/80 md:opacity-0 md:group-hover:opacity-100 md:size-10"
                  >
                    <svg className="size-4 md:size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center md:mt-16 flex flex-col items-center gap-6">
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-mid)]/40 px-8 py-3 text-sm font-medium text-[var(--text-muted)] transition-all hover:border-[var(--button-hover)] hover:bg-[var(--button)] hover:text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <svg className="size-4 animate-spin text-[var(--text-dim)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
              {loadingMore ? 'Loading...' : 'View More Experiences'}
            </button>
          )}
        </div>
      </div>

      {lightbox && (
        <ReviewLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
        />
      )}
    </section>
  );
}
