'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import gsap from 'gsap';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { createAdminReview, deleteAdminReview, fetchAdminReviews, updateAdminReview } from '@/lib/services/admin-reviews';
import { deleteAdminMediaByUrl, uploadAdminMedia } from '@/lib/services/admin-media';
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon, EditIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { ReviewCollectionLoadingSkeleton } from '@/components/admin/loading';
import { MediaDropzone } from '@/components/admin/gallery/media-dropzone';
import { GallerySearchFilterBar, GallerySummaryGrid } from '@/components/admin/gallery/gallery-shared-ui';
import { useToast } from '@/hooks/use-toast';
import type { PublicReviewItem, PublicReviewMedia } from '@/types/content';

const REVIEW_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'with-media', label: 'With Media' },
  { id: 'without-media', label: 'No Media' },
  { id: 'video', label: 'Video' },
];

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function preloadLightboxMedia(src: string, type: 'image' | 'video'): Promise<void> {
  if (typeof window === 'undefined' || !src) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadeddata = () => resolve();
      video.onerror = () => resolve();
      video.src = src;
      return;
    }

    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

const EMPTY_REVIEW: PublicReviewItem = {
  id: '',
  author: '',
  role: '',
  quote: '',
  collection: [],
};

interface ReviewLightboxProps {
  items: PublicReviewMedia[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

function ReviewLightbox({ items, index, onClose, onIndexChange }: ReviewLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(index);
  const [outgoing, setOutgoing] = useState<PublicReviewMedia | null>(null);
  const [current, setCurrent] = useState(items[index]);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    if (index === prevIndexRef.current) return;
    setOutgoing(current);
    prevIndexRef.current = index;
    setCurrent(items[index]);
    setMediaReady(false);
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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
          {!mediaReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/55 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
                </svg>
                Loading preview...
              </div>
            </div>
          )}
          {outgoing && (
            <div className="absolute inset-0 z-10 animate-[fadeOut_0.4s_ease-out_forwards]">
              {outgoing.type === 'video' ? (
                <div className="aspect-video">
                  <video src={outgoing.src} muted preload="metadata" className="size-full rounded-lg object-cover" />
                </div>
              ) : (
                <Image
                  src={outgoing.src}
                  alt=""
                  width={1600}
                  height={900}
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
                  preload="metadata"
                  onLoadedData={() => setMediaReady(true)}
                  className="size-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <Image
                src={current.src}
                alt=""
                width={1600}
                height={900}
                unoptimized
                onLoad={() => setMediaReady(true)}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            )}
            {current.type === 'video' && (
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
}

function AuthorAvatar({ name }: { name: string }) {
  const initial = name?.charAt(0).toUpperCase() || '?';
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-700/60 to-amber-900/60 text-sm font-semibold text-amber-200">
      {initial}
    </div>
  );
}

function MediaThumb({ src, type, size = 'sm' }: { src: string; type: 'image' | 'video'; size?: 'sm' | 'md' }) {
  const [error, setError] = useState(false);
  const dim = size === 'md' ? 'size-16' : 'size-9';

  if (!src || error) {
    return (
      <div className={`${dim} flex shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)]`}>
        <svg className="size-4 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${dim} relative shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-black`}>
      {type === 'video' ? (
        <>
          <video src={src} muted className="size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <svg className="size-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </>
      ) : (
        <Image src={src} alt="" fill unoptimized className="object-cover" onError={() => setError(true)} />
      )}
    </div>
  );
}

interface EditReviewDialogProps {
  open: boolean;
  item: PublicReviewItem;
  saving: boolean;
  uploadProgress: number;
  uploadStage: 'idle' | 'uploading' | 'finalizing';
  onSave: (payload: {
    item: PublicReviewItem;
    original: PublicReviewItem;
    pendingMedia: Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>;
  }) => void;
  onClose: () => void;
}

function EditReviewDialog({ open, item, saving, uploadProgress, uploadStage, onSave, onClose }: EditReviewDialogProps) {
  const [form, setForm] = useState<PublicReviewItem>(item);
  const [pendingMedia, setPendingMedia] = useState<Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>>([]);
  const [animatedUploadProgress, setAnimatedUploadProgress] = useState(0);
  const pendingMediaRef = useRef<Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>>([]);
  const wasSavingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    pendingMediaRef.current = pendingMedia;
  }, [pendingMedia]);

  useEffect(() => {
    return () => {
      for (const media of pendingMediaRef.current) {
        URL.revokeObjectURL(media.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!saving || uploadStage === 'idle') return;

    const timer = window.setInterval(() => {
      setAnimatedUploadProgress((prev) => {
        const delta = uploadProgress - prev;
        if (Math.abs(delta) < 0.6) return uploadProgress;
        return prev + delta * 0.22;
      });
    }, 24);

    return () => window.clearInterval(timer);
  }, [saving, uploadProgress, uploadStage]);

  useEffect(() => {
    if (saving && !wasSavingRef.current) {
      const rafId = window.requestAnimationFrame(() => {
        setAnimatedUploadProgress(0);
      });
      wasSavingRef.current = true;
      return () => window.cancelAnimationFrame(rafId);
    }

    if (!saving) {
      wasSavingRef.current = false;
    }
  }, [saving]);

  const combinedMedia = useMemo(
    () => [
      ...form.collection.map((media, index) => ({ ...media, source: 'existing' as const, sourceIndex: index })),
      ...pendingMedia.map((media) => ({ src: media.previewUrl, type: media.type, source: 'pending' as const, pendingId: media.id })),
    ],
    [form.collection, pendingMedia],
  );

  const handleSave = () => {
    if (saving) return;
    if (!form.author.trim() || !form.quote.trim()) return;
    onSave({ item: { ...form, author: form.author.trim(), quote: form.quote.trim() }, original: item, pendingMedia });
  };

  const isSaveDisabled = useMemo(() => {
    if (saving) return true;
    if (!form.author.trim()) return true;
    if (!form.quote.trim()) return true;
    return false;
  }, [form.author, form.quote, saving]);

  const removeMedia = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      collection: prev.collection.filter((_, i) => i !== index),
    }));
  }, []);

  const queueMediaFiles = useCallback((files: File[], forcedType: 'image' | 'video') => {
    if (files.length === 0) return;

    setPendingMedia((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type: forcedType,
      })),
    ]);
    toast.success(`${files.length} ${forcedType}${files.length > 1 ? 's' : ''} ready. They will upload on Save.`);
  }, [toast]);

  const handleDropImages = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const files = droppedFiles.filter((file) => file.type.startsWith('image/'));
    const invalidCount = droppedFiles.length - files.length;
    if (invalidCount > 0) {
      toast.error(`Invalid file type: ${invalidCount} file${invalidCount > 1 ? 's' : ''} must be image format.`);
    }
    queueMediaFiles(files, 'image');
  }, [queueMediaFiles, toast]);

  const handleDropVideos = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const files = droppedFiles.filter((file) => file.type.startsWith('video/'));
    const invalidCount = droppedFiles.length - files.length;
    if (invalidCount > 0) {
      toast.error(`Invalid file type: ${invalidCount} file${invalidCount > 1 ? 's' : ''} must be video format.`);
    }
    queueMediaFiles(files, 'video');
  }, [queueMediaFiles, toast]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueMediaFiles(files, 'image');
  }, [queueMediaFiles]);

  const handleVideoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueMediaFiles(files, 'video');
  }, [queueMediaFiles]);

  const openImagePicker = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const openVideoPicker = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:mx-4 sm:max-w-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {item.id ? 'Edit Review' : 'New Review'}
          </h3>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] sm:size-8"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleVideoUpload}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Author</label>
              <input
                value={form.author}
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                placeholder="Author name"
              />
            </div>
            <div className="sm:w-44">
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Role</label>
              <input
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                placeholder="Wedding, 2025"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Review</label>
            <textarea
              value={form.quote}
              onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="Review quote"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-dim)]">Media</label>
              <span className="text-[10px] text-[var(--text-dim)]">{form.collection.length} item{form.collection.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="mb-2 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={openImagePicker}
                disabled={saving}
                className="min-h-9 rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-60"
              >
                Upload Images
              </button>
              <button
                type="button"
                onClick={openVideoPicker}
                disabled={saving}
                className="min-h-9 rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-60"
              >
                Upload Videos
              </button>
            </div>

            {saving && uploadStage !== 'idle' && (
              <div className="mb-2 rounded-lg border border-[var(--border)] bg-[var(--bg-start)] px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--text-dim)]">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
                    </svg>
                    {uploadStage === 'uploading' ? 'Uploading media to Drive...' : 'Finalizing review...'}
                  </span>
                  <span>{Math.round(animatedUploadProgress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--button)]">
                  <div
                    className="h-full rounded-full bg-amber-500/80 transition-all duration-300"
                    style={{ width: `${Math.max(5, animatedUploadProgress)}%` }}
                  />
                </div>
              </div>
            )}

            <MediaDropzone
              title="Drop image files here"
              hint="Drag files here or click to upload from your device"
              icon="image"
              onDrop={handleDropImages}
              onClick={openImagePicker}
              className="mb-2"
            />

            <MediaDropzone
              title="Drop video files here"
              hint="Drag files here or click to upload from your device"
              icon="video"
              onDrop={handleDropVideos}
              onClick={openVideoPicker}
              className="mb-2"
            />

            <div className="scrollbar-hidden max-h-64 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-start)] p-2">
              {combinedMedia.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-dim)]">No media yet. Upload from your device.</p>
              ) : (
                combinedMedia.map((media, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] p-2 transition-colors hover:border-amber-700/30"
                  >
                    <MediaThumb src={media.src} type={media.type} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-dim)]">{media.src.split('/').pop() || 'media file'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (media.source === 'pending') {
                          setPendingMedia((prev) => {
                            const target = prev.find((entry) => entry.id === media.pendingId);
                            if (target) {
                              window.setTimeout(() => URL.revokeObjectURL(target.previewUrl), 0);
                            }
                            return prev.filter((entry) => entry.id !== media.pendingId);
                          });
                        } else {
                          removeMedia(media.sourceIndex);
                        }
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                      title="Remove"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-4 py-4 sm:flex-row sm:px-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="min-h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="min-h-10 flex-1 rounded-lg bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCollectionPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mounted, setMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'with-media' | 'without-media' | 'video'>('all');
  const [lightbox, setLightbox] = useState<{ items: PublicReviewMedia[]; index: number } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PublicReviewItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveUploadProgress, setSaveUploadProgress] = useState(0);
  const [saveUploadStage, setSaveUploadStage] = useState<'idle' | 'uploading' | 'finalizing'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  const createProfessionalFileName = useCallback((author: string, type: 'image' | 'video', file: File) => {
    const extFromName = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
    const extFromType = file.type.includes('/') ? file.type.split('/')[1] : '';
    const ext = (extFromName || extFromType || (type === 'video' ? 'mp4' : 'jpg')).toLowerCase();
    const slug = author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'review';
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 7);
    return `review-${slug}-${type}-${stamp}-${random}.${ext}`;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!isAuthenticated()) {
        setLastPage('/admin/gallery/reviews');
        router.push('/admin/login');
        return;
      }

      try {
        const rows = await fetchAdminReviews();
        if (!active) return;
        setReviews(rows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Failed to load reviews');
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [router, toast]);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => {
        if (!prev) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return !prev;
      });
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  }, [isMobile]);

  const handleAddNew = useCallback(() => {
    setEditItem({
      ...EMPTY_REVIEW,
      id: '',
    });
  }, []);

  const handleSaveEdit = useCallback(async (payload: { item: PublicReviewItem; original: PublicReviewItem; pendingMedia: Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }> }) => {
    const { item: updated, original, pendingMedia } = payload;
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    setSaveUploadProgress(5);

    const uploadedUrls: string[] = [];

    try {
      if (pendingMedia.length > 0) {
        setSaveUploadStage('uploading');
      }

      const uploaded: Array<{ src: string; type: 'image' | 'video' }> = [];
      for (let index = 0; index < pendingMedia.length; index += 1) {
        const media = pendingMedia[index];
        const url = await uploadAdminMedia(media.file, {
          fileName: createProfessionalFileName(updated.author, media.type, media.file),
        });
        uploadedUrls.push(url);
        uploaded.push({ src: url, type: media.type as 'image' | 'video' });
        const progress = 10 + Math.round(((index + 1) / Math.max(1, pendingMedia.length)) * 70);
        setSaveUploadProgress(progress);
      }

      setSaveUploadStage('finalizing');
      setSaveUploadProgress(90);

      const normalizedPayload: PublicReviewItem = {
        ...updated,
        collection: [...updated.collection, ...uploaded],
      };

      if (!updated.id) {
        const created = await createAdminReview(normalizedPayload);
        setSaveUploadProgress(100);
        setReviews((prev) => [created, ...prev]);
        setEditItem(null);
        toast.success('Review created');
        return;
      }

      const saved = await updateAdminReview(updated.id, normalizedPayload);
      setSaveUploadProgress(100);
      setReviews((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));

      const originalUrls = original.collection.map((media) => media.src);
      const savedUrls = new Set(saved.collection.map((media) => media.src));
      const removedUrls = originalUrls.filter((url) => !savedUrls.has(url));
      if (removedUrls.length > 0) {
        await Promise.allSettled(removedUrls.map((url) => deleteAdminMediaByUrl(url)));
      }

      setEditItem(null);
      toast.success('Review updated');
    } catch (error) {
      if (uploadedUrls.length > 0) {
        await Promise.allSettled(uploadedUrls.map((url) => deleteAdminMediaByUrl(url)));
      }
      toast.error(error instanceof Error ? error.message : 'Failed to save review');
    } finally {
      setIsSavingEdit(false);
      setSaveUploadProgress(0);
      setSaveUploadStage('idle');
    }
  }, [createProfessionalFileName, isSavingEdit, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const previous = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirm(null);

    try {
      await deleteAdminReview(id);
      toast.success('Review deleted');
    } catch (error) {
      setReviews(previous);
      toast.error(error instanceof Error ? error.message : 'Failed to delete review');
    }
  }, [reviews, toast]);

  const handleToggleVisibility = useCallback(async (id: string, currentIsActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update visibility');
      
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !currentIsActive } : r));
      toast.success(!currentIsActive ? 'Review published to landing page' : 'Review hidden from landing page');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  }, [toast]);

  const handlePreview = useCallback(async (review: PublicReviewItem) => {
    if (review.collection.length === 0) return;

    setPreviewLoadingId(review.id);
    try {
      await preloadLightboxMedia(review.collection[0].src, review.collection[0].type);
      setLightbox({ items: review.collection, index: 0 });
    } finally {
      setPreviewLoadingId(null);
    }
  }, []);

  const reviewStats = useMemo(() => {
    const withMedia = reviews.filter((review) => review.collection.length > 0).length;
    const noMedia = reviews.length - withMedia;
    const withVideo = reviews.filter((review) => review.collection.some((media) => media.type === 'video')).length;
    return {
      total: reviews.length,
      withMedia,
      noMedia,
      withVideo,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return reviews.filter((review) => {
      if (mediaFilter === 'with-media' && review.collection.length === 0) return false;
      if (mediaFilter === 'without-media' && review.collection.length > 0) return false;
      if (mediaFilter === 'video' && !review.collection.some((media) => media.type === 'video')) return false;

      if (!query) return true;

      return (
        review.author.toLowerCase().includes(query) ||
        review.role.toLowerCase().includes(query) ||
        review.quote.toLowerCase().includes(query)
      );
    });
  }, [reviews, searchQuery, mediaFilter]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {isMobile ? (
          <MobileSidebar
            open={mobileSidebarOpen}
            onClose={() => { setMobileSidebarOpen(false); document.body.style.overflow = ''; }}
          />
        ) : (
          <DesktopSidebar expanded={sidebarExpanded} />
        )}

        <main className="scrollbar-hidden flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title="Review Collection"
              description="Manage client reviews and their attached media"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddNew}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <PlusIcon />
                  <span>Add Review</span>
                </Button>
              }
            />

            {isBootstrapping ? (
              <ReviewCollectionLoadingSkeleton />
            ) : (
              <>
                <GallerySummaryGrid
                  items={[
                    { label: 'Total Reviews', value: reviewStats.total },
                    { label: 'With Attachments', value: reviewStats.withMedia },
                    { label: 'No Attachments', value: reviewStats.noMedia },
                    { label: 'Contains Video', value: reviewStats.withVideo },
                  ]}
                />

                <GallerySearchFilterBar
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  queryPlaceholder="Search author, role or review"
                  filterOptions={REVIEW_FILTER_OPTIONS}
                  activeFilter={mediaFilter}
                  onFilterChange={(value) => setMediaFilter(value as 'all' | 'with-media' | 'without-media' | 'video')}
                />

                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-16 text-center">
                    <svg className="size-10 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-[var(--text)]">No reviews yet</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">
                      Add your first review to showcase client feedback.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddNew}
                      className="mt-4 border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      <PlusIcon />
                      <span>Add Review</span>
                    </Button>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[var(--text)]">No matching reviews found</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">Try a different search term or media filter.</p>
                  </div>
                ) : (
                  <>
                <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-start)]">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Author</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Review</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Attachments</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Visibility</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredReviews.map((review) => (
                        <tr
                          key={review.id}
                          className="bg-[var(--bg-mid)]/30 transition-colors odd:bg-[var(--bg-start)]/30 hover:bg-[var(--bg-start)]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <AuthorAvatar name={review.author} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-[var(--text)]">{review.author}</p>
                                <p className="truncate text-xs text-[var(--text-dim)]">{review.role || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-xs px-4 py-3">
                            <p className="line-clamp-2 text-[var(--text-muted)]">
                              &ldquo;{review.quote}&rdquo;
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {review.collection.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-2">
                                  {review.collection.slice(0, 3).map((media, i) => (
                                    <div key={i} className="ring-2 ring-[var(--bg-mid)]">
                                      <MediaThumb src={media.src} type={media.type} size="sm" />
                                    </div>
                                  ))}
                                </div>
                                {review.collection.length > 3 && (
                                  <span className="text-[10px] font-medium text-[var(--text-dim)]">
                                    +{review.collection.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-dim)]">&mdash;</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleVisibility(review.id, review.isActive || false)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                                review.isActive ? 'bg-amber-500' : 'bg-stone-700'
                              }`}
                              title={review.isActive ? 'Visible on public page' : 'Hidden from public page'}
                            >
                              <span
                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  review.isActive ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {review.collection.length > 0 && (
                                <button
                                  onClick={() => handlePreview(review)}
                                  disabled={previewLoadingId === review.id}
                                  className="flex size-8 items-center justify-center rounded-md text-xs text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-50"
                                  title="View collection"
                                >
                                  {previewLoadingId === review.id ? (
                                    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
                                    </svg>
                                  ) : (
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => setEditItem(review)}
                                className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                                title="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(review.id)}
                                className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                                title="Delete"
                              >
                                <XIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <AuthorAvatar name={review.author} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text)]">{review.author}</p>
                          <p className="truncate text-xs text-[var(--text-dim)]">{review.role || '—'}</p>
                        </div>
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-[var(--text-muted)]">
                        &ldquo;{review.quote}&rdquo;
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {review.collection.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-2">
                                {review.collection.slice(0, 3).map((media, i) => (
                                  <div key={i} className="ring-2 ring-[var(--bg-start)]">
                                    <MediaThumb src={media.src} type={media.type} size="sm" />
                                  </div>
                                ))}
                              </div>
                              {review.collection.length > 3 && (
                                <span className="text-[10px] font-medium text-[var(--text-dim)]">
                                  +{review.collection.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-dim)]">No attachments</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleVisibility(review.id, review.isActive || false)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                              review.isActive ? 'bg-amber-500' : 'bg-stone-700'
                            }`}
                            title={review.isActive ? 'Visible on public page' : 'Hidden from public page'}
                          >
                            <span
                              className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                review.isActive ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          {review.collection.length > 0 && (
                            <button
                              onClick={() => handlePreview(review)}
                              disabled={previewLoadingId === review.id}
                              className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-50"
                              title="View collection"
                            >
                              {previewLoadingId === review.id ? (
                                <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
                                </svg>
                              ) : (
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setEditItem(review)}
                            className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(review.id)}
                            className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                            title="Delete"
                          >
                            <XIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </>
                )}
              </>
            )}
          </AdminPageShell>
        </main>
      </div>

      {lightbox && (
        <ReviewLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
        />
      )}

      {editItem && (
        <EditReviewDialog
          key={editItem.id || 'new-review'}
          open
          item={editItem}
          saving={isSavingEdit}
          uploadProgress={saveUploadProgress}
          uploadStage={saveUploadStage}
          onSave={handleSaveEdit}
          onClose={() => {
            if (!isSavingEdit) setEditItem(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] p-5 shadow-2xl sm:mx-4 sm:max-w-xs sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-medium text-[var(--text)]">
              Delete this review?
            </p>
            <p className="mt-1 text-center text-xs text-[var(--text-dim)]">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-lg bg-red-800/60 px-3 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-700/60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
