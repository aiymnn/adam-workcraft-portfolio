'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createAdminVaultCollection, deleteAdminVaultCollection, fetchAdminVaultCollections, updateAdminVaultCollection, reorderAdminVaultCollections } from '@/lib/services/admin-vault';
import { deleteAdminMediaByUrl, uploadAdminMedia } from '@/lib/services/admin-media';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { PlusIcon, XIcon, EditIcon, ImageIcon, ExternalLinkIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { VaultLoadingSkeleton } from '@/components/admin/loading';
import { MediaDropzone } from '@/components/admin/gallery/media-dropzone';
import { GallerySearchFilterBar, GallerySummaryGrid } from '@/components/admin/gallery/gallery-shared-ui';
import { useToast } from '@/hooks/use-toast';



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

interface VaultLightboxMedia {
  src: string;
  type: 'image' | 'video';
}

interface VaultLightboxProps {
  items: VaultLightboxMedia[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

function VaultLightbox({ items, index, onClose, onIndexChange }: VaultLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(index);
  const [outgoing, setOutgoing] = useState<VaultLightboxMedia | null>(null);
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

interface VaultRowProps {
  item: PublicVaultCollection;
  index: number;
  previewLoadingId: string | null;
  onUpdate: (id: string, updates: Partial<PublicVaultCollection>) => void;
  onEdit: (item: PublicVaultCollection) => void;
  onPreview: (item: PublicVaultCollection) => void;
  onDelete: (id: string) => void;
  onReorder?: (id: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function VaultRow({ item, index, previewLoadingId, onUpdate, onEdit, onPreview, onDelete, onReorder, isFirst, isLast }: VaultRowProps) {
  const isVideo = item.isVideo;
  const hasMedia = item.media.length > 0 || (item.videos?.length ?? 0) > 0;
  const isPreviewLoading = previewLoadingId === item.id;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] transition-colors hover:border-[var(--button-hover)]">
      <div className="flex flex-col md:flex-row md:items-center md:gap-3 md:p-3">
        <div className="flex items-center px-4 pt-4 md:px-0 md:pt-0">
          <span className="w-6 text-xs font-medium text-[var(--text-dim)]">{index + 1}</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-3 md:px-0 md:pt-0">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[var(--button)] md:size-10">
            {isVideo ? (
              <div className="flex size-full items-center justify-center text-[var(--text-dim)]">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            ) : (
              <Image
                src={item.thumb}
                alt=""
                fill
                unoptimized
                sizes="44px"
                className="object-cover"
              />
            )}
          </div>
        </div>

        <div className="mx-4 mt-3 hidden min-w-0 flex-1 md:mx-0 md:mt-0 md:block">
          <p className="truncate text-sm font-medium text-[var(--text)]">{item.title}</p>
        </div>

        <div className="mx-4 mt-3 hidden md:mx-0 md:mt-0 md:block md:w-32">
          <span className="inline-flex min-h-9 w-full items-center rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 text-sm text-[var(--text-muted)]">
            {item.category}
          </span>
        </div>



        <div className="mx-4 mt-3 hidden md:mx-0 md:mt-0 md:flex md:items-center md:gap-1">
          <button
            onClick={() => onPreview(item)}
            disabled={!hasMedia || isPreviewLoading}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-50"
            title="Preview collection"
          >
            {isPreviewLoading ? (
              <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
              </svg>
            ) : (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
            title="Edit details"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
            title="Delete"
          >
            <XIcon />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 md:hidden">
        <div className="mb-3 space-y-1 text-xs text-[var(--text-muted)]">
          <p>
            <span className="text-[var(--text-dim)]">Category:</span> {item.category}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onPreview(item)}
            disabled={!hasMedia || isPreviewLoading}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--button)] px-4 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-50"
          >
            {isPreviewLoading ? (
              <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
              </svg>
            ) : (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {isPreviewLoading ? 'Loading...' : 'Preview'}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--button)] px-4 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          >
            <EditIcon className="size-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--button)] px-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/40"
          >
            <XIcon className="size-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM: PublicVaultCollection = {
  id: '',
  title: '',
  category: 'Photography',
  thumb: '',
  media: [],
  isVideo: false,
  videos: [],
  columnSpan: 1,
  rowSpan: 1,
  order: 0,
};

interface EditDialogProps {
  open: boolean;
  item: PublicVaultCollection;
  categoryOptions: SelectOption[];
  saving: boolean;
  uploadProgress: number;
  uploadStage: 'idle' | 'uploading' | 'finalizing';
  onSave: (payload: {
    item: PublicVaultCollection;
    original: PublicVaultCollection;
    pendingMedia: Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>;
  }) => void;
  onClose: () => void;
}

function EditDialog({ open, item, categoryOptions, saving, uploadProgress, uploadStage, onSave, onClose }: EditDialogProps) {
  const [form, setForm] = useState<PublicVaultCollection>(item);
  const [pendingMedia, setPendingMedia] = useState<Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>>([]);
  const [animatedUploadProgress, setAnimatedUploadProgress] = useState(0);
  const pendingMediaRef = useRef<Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }>>([]);
  const wasSavingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const effectiveCategoryOptions = useMemo(() => {
    if (categoryOptions.some((option) => option.value === form.category)) return categoryOptions;
    return [{ value: form.category, label: form.category }, ...categoryOptions];
  }, [categoryOptions, form.category]);

  const combinedMedia = useMemo(
    () => [
      ...form.media.map((src, index) => ({ src, type: 'image' as const, sourceIndex: index, source: 'existing' as const })),
      ...(form.videos ?? []).map((src, index) => ({ src, type: 'video' as const, sourceIndex: index, source: 'existing' as const })),
      ...pendingMedia.map((media) => ({ src: media.previewUrl, type: media.type, source: 'pending' as const, pendingId: media.id })),
    ],
    [form.media, form.videos, pendingMedia],
  );

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

  const handleSave = () => {
    if (saving) return;

    if (!form.title.trim()) return;

    const hasImages = form.media.length > 0 || pendingMedia.some((media) => media.type === 'image');
    const hasVideos = (form.videos?.length ?? 0) > 0 || pendingMedia.some((media) => media.type === 'video');

    if (!hasImages && !hasVideos) {
      toast.error('Upload at least one image or video for this collection');
      return;
    }

    onSave({
      item: {
        ...form,
        title: form.title.trim(),
        // Auto-derive type to avoid a separate checkbox flow.
        isVideo: !hasImages && hasVideos,
      },
      original: item,
      pendingMedia,
    });
  };

  const isSaveDisabled = useMemo(() => {
    if (saving) return true;
    if (!form.title.trim()) return true;

    const hasImages = form.media.length > 0 || pendingMedia.some((media) => media.type === 'image');
    const hasVideos = (form.videos?.length ?? 0) > 0 || pendingMedia.some((media) => media.type === 'video');

    return !hasImages && !hasVideos;
  }, [form.media.length, form.title, form.videos, pendingMedia, saving]);

  const queueFiles = useCallback((files: File[], type: 'image' | 'video') => {
    if (files.length === 0) return;

    setPendingMedia((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        type,
      })),
    ]);
    toast.success(`${files.length} ${type}${files.length > 1 ? 's' : ''} ready. They will upload on Save.`);
  }, [toast]);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueFiles(files, 'image');
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueFiles(files, 'video');
  };

  const handleDropImages = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const files = droppedFiles.filter((file) => file.type.startsWith('image/'));
    const invalidCount = droppedFiles.length - files.length;
    if (invalidCount > 0) {
      toast.error(`Invalid file type: ${invalidCount} file${invalidCount > 1 ? 's' : ''} must be image format.`);
    }
    queueFiles(files, 'image');
  };

  const handleDropVideos = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const files = droppedFiles.filter((file) => file.type.startsWith('video/'));
    const invalidCount = droppedFiles.length - files.length;
    if (invalidCount > 0) {
      toast.error(`Invalid file type: ${invalidCount} file${invalidCount > 1 ? 's' : ''} must be video format.`);
    }
    queueFiles(files, 'video');
  };

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
        className="flex max-h-[92vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:mx-4 sm:max-w-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {item.id ? 'Edit Collection' : 'New Collection'}
          </h3>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] sm:size-8"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-hidden flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleMediaUpload}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleVideoUpload}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="Collection title"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Category</label>
              <Select
                value={form.category}
                options={effectiveCategoryOptions}
                onChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-dim)]">Media</label>
              <span className="text-[10px] text-[var(--text-dim)]">{combinedMedia.length} item{combinedMedia.length !== 1 ? 's' : ''}</span>
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
                    {uploadStage === 'uploading' ? 'Uploading media to Drive...' : 'Finalizing collection...'}
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

            <div className="scrollbar-hidden max-h-52 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--button)] p-2 sm:max-h-56">
              {combinedMedia.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-dim)]">No media yet. Upload from your device.</p>
              ) : (
                combinedMedia.map((media, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] p-2 transition-colors hover:border-amber-700/30">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--button)]">
                      {media.type === 'video' ? (
                        <>
                          <video src={media.src} muted className="size-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="size-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <Image src={media.src} alt="Gallery image preview" fill unoptimized className="object-cover" />
                      )}
                    </div>
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
                        } else if (media.type === 'video') {
                          setForm((prev) => ({
                            ...prev,
                            videos: (prev.videos ?? []).filter((_, index) => index !== media.sourceIndex),
                          }));
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            media: prev.media.filter((_, index) => index !== media.sourceIndex),
                          }));
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

export default function PersonalVaultPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mounted, setMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collections, setCollections] = useState<PublicVaultCollection[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lightbox, setLightbox] = useState<{ items: VaultLightboxMedia[]; index: number } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PublicVaultCollection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveUploadProgress, setSaveUploadProgress] = useState(0);
  const [saveUploadStage, setSaveUploadStage] = useState<'idle' | 'uploading' | 'finalizing'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const createProfessionalFileName = useCallback((collectionTitle: string, type: 'image' | 'video', file: File) => {
    const extFromName = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
    const extFromType = file.type.includes('/') ? file.type.split('/')[1] : '';
    const ext = (extFromName || extFromType || (type === 'video' ? 'mp4' : 'jpg')).toLowerCase();
    const slug = collectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'collection';
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 7);
    return `vault-${slug}-${type}-${stamp}-${random}.${ext}`;
  }, []);

  const categoryOptions: SelectOption[] = [
    { value: 'Photography', label: 'Photography' },
    { value: 'Videography', label: 'Videography' },
  ];

  const vaultFilterOptions = [
    { id: 'all', label: 'All' },
    ...categoryOptions.map((item) => ({ id: item.value, label: item.label }))
  ];

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!isAuthenticated()) {
        setLastPage('/admin/gallery/vault');
        router.push('/admin/login');
        return;
      }

      try {
        const rows = await fetchAdminVaultCollections();
        if (!active) return;
        setCollections(rows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Failed to load vault data');
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [router, toast]);

  const sortedCollections = useMemo(
    () => [...collections].sort((a, b) => a.order - b.order),
    [collections],
  );

  const vaultStats = useMemo(() => {
    const totalAssets = collections.reduce((acc, item) => {
      const imageCount = item.media.length;
      const videoCount = item.videos?.length ?? 0;
      return acc + imageCount + videoCount;
    }, 0);
    return {
      total: collections.length,
      totalAssets,
    };
  }, [collections]);

  const effectiveCategoryFilter = useMemo(() => {
    if (categoryFilter === 'all') return 'all';
    return categoryOptions.some((option) => option.value === categoryFilter) ? categoryFilter : 'all';
  }, [categoryFilter, categoryOptions]);

  const filteredCollections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedCollections.filter((item) => {
      if (effectiveCategoryFilter !== 'all' && item.category !== effectiveCategoryFilter) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [sortedCollections, searchQuery, effectiveCategoryFilter]);

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

  const handleUpdate = useCallback(async (id: string, updates: Partial<PublicVaultCollection>) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      const updated = await updateAdminVaultCollection(id, updates);
      setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update collection');
      const rows = await fetchAdminVaultCollections();
      setCollections(rows);
    }
  }, [toast]);

  const handleEdit = useCallback((item: PublicVaultCollection) => {
    setEditItem(item);
  }, []);

  const handlePreview = useCallback(async (item: PublicVaultCollection) => {
    const items: VaultLightboxMedia[] = [
      ...item.media.map((src) => ({ src, type: 'image' as const })),
      ...(item.videos ?? []).map((src) => ({ src, type: 'video' as const })),
    ];

    if (items.length > 0) {
      setPreviewLoadingId(item.id);
      try {
        await preloadLightboxMedia(items[0].src, items[0].type);
        setLightbox({ items, index: 0 });
      } finally {
        setPreviewLoadingId(null);
      }
    }
  }, []);

  const handleSaveEdit = useCallback(async (payload: { item: PublicVaultCollection; original: PublicVaultCollection; pendingMedia: Array<{ id: string; file: File; previewUrl: string; type: 'image' | 'video' }> }) => {
    const { item: updated, original, pendingMedia } = payload;
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    setSaveUploadProgress(5);

    const uploadedUrls: string[] = [];

    try {
      if (pendingMedia.length > 0) {
        setSaveUploadStage('uploading');
      }

      const uploaded: Array<{ type: 'image' | 'video'; url: string }> = [];
      for (let index = 0; index < pendingMedia.length; index += 1) {
        const media = pendingMedia[index];
        const url = await uploadAdminMedia(media.file, {
          fileName: createProfessionalFileName(updated.title, media.type, media.file),
        });
        uploadedUrls.push(url);
        uploaded.push({ type: media.type, url });
        const progress = 10 + Math.round(((index + 1) / Math.max(1, pendingMedia.length)) * 70);
        setSaveUploadProgress(progress);
      }

      setSaveUploadStage('finalizing');
      setSaveUploadProgress(90);

      const nextImages = [...updated.media, ...uploaded.filter((item) => item.type === 'image').map((item) => item.url)];
      const nextVideos = [...(updated.videos ?? []), ...uploaded.filter((item) => item.type === 'video').map((item) => item.url)];
      const normalizedPayload: PublicVaultCollection = {
        ...updated,
        media: nextImages,
        videos: nextVideos,
        isVideo: nextImages.length === 0 && nextVideos.length > 0,
      };

      if (!updated.id) {
        const created = await createAdminVaultCollection({
          ...normalizedPayload,
          order: collections.length,
        });
        setSaveUploadProgress(100);
        setCollections((prev) => [...prev, created]);
        setEditItem(null);
        toast.success('Collection created');
        return;
      }

      const saved = await updateAdminVaultCollection(updated.id, normalizedPayload);
      setSaveUploadProgress(100);
      setCollections((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));

      const originalUrls = [...original.media, ...(original.videos ?? [])];
      const savedUrls = new Set([...saved.media, ...(saved.videos ?? [])]);
      const removedUrls = originalUrls.filter((url) => !savedUrls.has(url));
      if (removedUrls.length > 0) {
        await Promise.allSettled(removedUrls.map((url) => deleteAdminMediaByUrl(url)));
      }

      setEditItem(null);
      toast.success('Collection updated');
    } catch (error) {
      if (uploadedUrls.length > 0) {
        await Promise.allSettled(uploadedUrls.map((url) => deleteAdminMediaByUrl(url)));
      }
      toast.error(error instanceof Error ? error.message : 'Failed to save collection');
    } finally {
      setIsSavingEdit(false);
      setSaveUploadProgress(0);
      setSaveUploadStage('idle');
    }
  }, [collections.length, createProfessionalFileName, isSavingEdit, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const prev = collections;
    const filtered = prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i }));
    setCollections(filtered);
    setDeleteConfirm(null);

    try {
      await deleteAdminVaultCollection(id);
      toast.success('Collection deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
      setCollections(prev);
    }
  }, [collections, toast]);

  const handleReorder = useCallback(async (id: string, direction: 'up' | 'down') => {
    const index = collections.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === collections.length - 1) return;

    const newCollections = [...collections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newCollections[index];
    newCollections[index] = newCollections[targetIndex];
    newCollections[targetIndex] = temp;

    // Update order values based on array index
    const updatedCollections = newCollections.map((c, i) => ({ ...c, order: i }));
    setCollections(updatedCollections);

    try {
      await reorderAdminVaultCollections(
        updatedCollections.map(c => ({ id: c.id, sortOrder: c.order }))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save new order');
      // Revert on failure
      setCollections(collections);
    }
  }, [collections, toast]);

  const handleAddNew = useCallback(() => {
    const defaultCategory = categoryOptions[0]?.value || '';

    if (!defaultCategory) {
      toast.error('Create at least one category before adding collection');
      return;
    }

    setEditItem({
      ...EMPTY_FORM,
      id: '',
      category: defaultCategory,
      order: collections.length,
    });
  }, [categoryOptions, collections.length, toast]);



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
              title="Personal Vault"
              description="Manage your vault collections, categories, and media for the landing page."
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddNew}
                    className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                  >
                    <PlusIcon />
                    <span>Add</span>
                  </Button>
                </div>
              }
            />

            {isBootstrapping ? (
              <VaultLoadingSkeleton />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 md:gap-3">
                  <p className="text-xs text-[var(--text-dim)]">
                    Manage your vault collections and media from here.
                  </p>
                  <button
                    onClick={() => window.open('/', '_blank')}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    View Live Site
                  </button>
                </div>

                <GallerySummaryGrid
                  items={[
                    { label: 'Total Collections', value: vaultStats.total },
                    { label: 'Media Assets', value: vaultStats.totalAssets },
                  ]}
                />

                <GallerySearchFilterBar
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  queryPlaceholder="Search by title or category"
                  filterOptions={vaultFilterOptions}
                  activeFilter={effectiveCategoryFilter}
                  onFilterChange={setCategoryFilter}
                />

                {collections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-16 text-center">
                    <ImageIcon className="size-10 text-[var(--text-dim)]" />
                    <p className="mt-3 text-sm font-medium text-[var(--text)]">No collections yet</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">
                      Add your first collection to start building your vault.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddNew}
                      className="mt-4 border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      <PlusIcon />
                      <span>Add Collection</span>
                    </Button>
                  </div>
                ) : filteredCollections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[var(--text)]">No matching collection found</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">Try adjusting search or category filter.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCollections.map((item, index) => (
                      <VaultRow
                        key={item.id}
                        item={item}
                        index={index}
                        previewLoadingId={previewLoadingId}
                        onUpdate={handleUpdate}
                        onEdit={handleEdit}
                        onPreview={handlePreview}
                        onDelete={setDeleteConfirm}
                        onReorder={handleReorder}
                        isFirst={index === 0}
                        isLast={index === filteredCollections.length - 1}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </AdminPageShell>
        </main>
      </div>

      {editItem && (
        <EditDialog
          key={editItem.id || 'new-collection'}
          open
          item={editItem}
          categoryOptions={categoryOptions}
          saving={isSavingEdit}
          uploadProgress={saveUploadProgress}
          uploadStage={saveUploadStage}
          onSave={handleSaveEdit}
          onClose={() => {
            if (!isSavingEdit) setEditItem(null);
          }}
        />
      )}

      {lightbox && (
        <VaultLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : null))}
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
              Delete this collection?
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
