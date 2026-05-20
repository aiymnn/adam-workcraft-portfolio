'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useLanguageTheme } from '@/context/language-theme-context';

interface CollectionItem {
  id: string;
  title: string;
  category: string;
  thumb: string;
  media: string[];
  isVideo?: boolean;
  videoUrl?: string;
}

interface LightboxModalProps {
  isOpen: boolean;
  collection: CollectionItem | null;
  onClose: () => void;
}

export default function LightboxModal({ isOpen, collection, onClose }: LightboxModalProps) {
  const { t } = useLanguageTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const handleClose = useCallback(() => {
    if (!overlayRef.current || !panelRef.current) return;
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.35, ease: 'power3.inOut' });
    gsap.to(panelRef.current, { scale: 0.95, opacity: 0, duration: 0.35, ease: 'power3.inOut', onComplete: onClose });
  }, [onClose]);

  const navigate = useCallback((dir: 'prev' | 'next') => {
    if (!collection || collection.isVideo || !mediaRef.current) return;
    const total = collection.media.length;
    const isNext = dir === 'next';

    gsap.to(mediaRef.current, {
      opacity: 0,
      x: isNext ? -40 : 40,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setMediaIndex((i) => {
          if (isNext) return i < total - 1 ? i + 1 : 0;
          return i > 0 ? i - 1 : total - 1;
        });
      },
    });
  }, [collection]);

  useEffect(() => {
    setMediaIndex(0);
    setVideoPlaying(false);
  }, [collection]);

  useEffect(() => {
    if (!mediaRef.current || collection?.isVideo) return;
    gsap.set(mediaRef.current, { x: 0 });
    gsap.fromTo(mediaRef.current, { opacity: 0, x: 0 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
  }, [mediaIndex, collection]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') navigate('prev');
      if (e.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose, navigate]);

  useEffect(() => {
    if (!isOpen || !overlayRef.current || !panelRef.current) return;

    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power3.inOut' });
      gsap.fromTo(panelRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.inOut', delay: 0.1 });
    });

    return () => {
      ctx.revert();
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePlayVideo = () => {
    if (playBtnRef.current) {
      gsap.to(playBtnRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          setVideoPlaying(true);
          if (videoRef.current) videoRef.current.play();
        },
      });
    } else {
      setVideoPlaying(true);
      if (videoRef.current) videoRef.current.play();
    }
  };

  if (!isOpen || !collection) return null;

  const isVideo = collection.isVideo;
  const total = collection.media.length;
  const currentSrc = collection.media[mediaIndex];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
      style={{ willChange: 'opacity, transform' }}
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="relative flex w-full max-w-5xl flex-col items-center px-4"
        style={{ willChange: 'opacity, transform' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-[60] flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-stone-900/60 text-sm text-[var(--text)] backdrop-blur-md transition-transform active:scale-95 md:right-8 md:top-8 md:size-11"
        >
          &#x2715;
        </button>

        {isVideo ? (
          <div className="relative w-full max-w-[90vw] md:max-w-[80vw]">
            <div ref={videoWrapRef} className="aspect-video w-full">
              <video
                ref={videoRef}
                className="size-full rounded-lg object-cover"
                src={collection.videoUrl}
                onEnded={() => setVideoPlaying(false)}
              />
            </div>
            <button
              onClick={() => {
                const el = videoWrapRef.current;
                if (el) {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else el.requestFullscreen();
                }
              }}
              className="absolute bottom-3 right-3 z-10 flex size-7 items-center justify-center rounded border border-[var(--border)] bg-black/60 text-[var(--text-muted)] transition-colors hover:text-white md:size-8"
              title="Fullscreen"
            >
              <svg className="size-3.5 md:size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V3m0 0h5M3 3l6 6m12 0V3m0 0h-5m5 0l-6 6M3 16v5m0 0h5m-5 0l6-6m12 5v-5m0 5h-5m5 0l-6-6" />
              </svg>
            </button>
            {!videoPlaying && (
              <button
                onClick={handlePlayVideo}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div ref={playBtnRef} className="relative flex size-16 items-center justify-center md:size-20">
                  <div className="relative flex size-full items-center justify-center rounded-full border border-stone-100/30 bg-stone-100/10 backdrop-blur-md transition-transform hover:scale-110">
                    <svg className="size-7 text-white/80 md:size-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6v12l12-6z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="relative flex w-full max-w-[90vw] items-center md:max-w-[80vw]">
            {total > 1 && (
              <button
                onClick={() => navigate('prev')}
                className="absolute -left-3 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] transition-colors hover:border-amber-700/50 hover:text-amber-200/80 md:-left-6 md:size-12"
              >
                <svg className="size-4 md:size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div ref={mediaRef} className="relative w-full">
              <img
                src={currentSrc}
                alt={`${collection.title} ${mediaIndex + 1}`}
                className="max-h-[75vh] w-full rounded-lg object-contain md:max-h-[85vh]"
              />
              <button
                onClick={() => {
                  const el = mediaRef.current;
                  if (el) {
                    if (document.fullscreenElement) document.exitFullscreen();
                    else el.requestFullscreen();
                  }
                }}
                className="absolute bottom-3 right-3 z-10 flex size-7 items-center justify-center rounded border border-[var(--border)] bg-black/60 text-[var(--text-muted)] transition-colors hover:text-white md:size-8"
                title="Fullscreen"
              >
                <svg className="size-3.5 md:size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V3m0 0h5M3 3l6 6m12 0V3m0 0h-5m5 0l-6 6M3 16v5m0 0h5m-5 0l6-6m12 5v-5m0 5h-5m5 0l-6-6" />
                </svg>
              </button>
            </div>
            {total > 1 && (
              <button
                onClick={() => navigate('next')}
                className="absolute -right-3 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] transition-colors hover:border-amber-700/50 hover:text-amber-200/80 md:-right-6 md:size-12"
              >
                <svg className="size-4 md:size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="mt-4 text-center md:mt-6">
          <p className="text-base font-medium text-[var(--text)] md:text-lg">{collection.title}</p>
          <p className="mt-1 text-xs text-[var(--text-dim)] md:text-sm">
            {isVideo
              ? t.lightbox.videography
              : `${collection.category} — ${mediaIndex + 1} ${t.lightbox.of} ${total}`}
          </p>
        </div>
      </div>
    </div>
  );
}
