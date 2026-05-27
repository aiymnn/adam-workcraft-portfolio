'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { loadReviews, saveReviews, generateId, type AdminReview, type ReviewMedia } from '@/lib/services/reviews';
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon, EditIcon, ExternalLinkIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const EMPTY_REVIEW: AdminReview = {
  id: '',
  author: '',
  role: '',
  quote: '',
  collection: [],
};

function detectMediaType(src: string): 'image' | 'video' {
  const ext = src.split('?')[0].toLowerCase();
  if (ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.mov') || ext.includes('/video-')) return 'video';
  return 'image';
}

interface ReviewLightboxProps {
  items: ReviewMedia[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

function ReviewLightbox({ items, index, onClose, onIndexChange }: ReviewLightboxProps) {
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
          {outgoing && (
            <div className="absolute inset-0 z-10 animate-[fadeOut_0.4s_ease-out_forwards]">
              {outgoing.type === 'video' ? (
                <div className="aspect-video">
                  <video src={outgoing.src} muted className="size-full rounded-lg object-cover" />
                </div>
              ) : (
                <img src={outgoing.src} alt="" className="max-h-[70vh] w-full rounded-lg object-contain" />
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
              <img
                src={current.src}
                alt=""
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
        <img src={src} alt="" className="size-full object-cover" onError={() => setError(true)} />
      )}
    </div>
  );
}

interface EditReviewDialogProps {
  open: boolean;
  item: AdminReview;
  onSave: (item: AdminReview) => void;
  onClose: () => void;
}

function EditReviewDialog({ open, item, onSave, onClose }: EditReviewDialogProps) {
  const [form, setForm] = useState<AdminReview>(item);

  useEffect(() => {
    setForm(item);
  }, [item]);

  const handleSave = () => {
    if (!form.author.trim() || !form.quote.trim()) return;
    onSave({ ...form, author: form.author.trim(), quote: form.quote.trim() });
  };

  const updateMediaSrc = useCallback((index: number, src: string) => {
    setForm((prev) => {
      const next = [...prev.collection];
      next[index] = { src, type: detectMediaType(src) };
      return { ...prev, collection: next };
    });
  }, []);

  const addMedia = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      collection: [...prev.collection, { src: '', type: 'image' as const }],
    }));
  }, []);

  const removeMedia = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      collection: prev.collection.filter((_, i) => i !== index),
    }));
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:mx-4 sm:max-w-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {item.id ? 'Edit Review' : 'New Review'}
          </h3>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)]"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
              <label className="text-xs font-medium text-[var(--text-dim)]">Media URLs</label>
              <span className="text-[10px] text-[var(--text-dim)]">{form.collection.length} item{form.collection.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-start)] p-2">
              {form.collection.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-dim)]">No media yet. Click below to add.</p>
              ) : (
                form.collection.map((media, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] p-2 transition-colors hover:border-amber-700/30"
                  >
                    <MediaThumb src={media.src} type={media.type} size="sm" />
                    <input
                      value={media.src}
                      onChange={(e) => updateMediaSrc(i, e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                      placeholder="https://images.unsplash.com/..."
                    />
                    {media.src && (
                      <button
                        onClick={() => window.open(media.src, '_blank')}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                        title="Preview in new tab"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeMedia(i)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                      title="Remove"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={addMedia}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-start)] px-3 py-2 text-xs font-medium text-[var(--text-dim)] transition-colors hover:border-amber-700/40 hover:text-amber-300/80"
            >
              <PlusIcon className="size-3.5" />
              Add Media
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCollectionPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [lightbox, setLightbox] = useState<{ items: ReviewMedia[]; index: number } | null>(null);
  const [editItem, setEditItem] = useState<AdminReview | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLastPage('/admin/gallery/reviews');
      router.push('/admin/login');
      return;
    }
    setReviews(loadReviews());
  }, [router]);

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
    const newItem: AdminReview = {
      ...EMPTY_REVIEW,
      id: generateId(),
    };
    setReviews((prev) => {
      const next = [...prev, newItem];
      saveReviews(next);
      return next;
    });
    setEditItem(newItem);
  }, []);

  const handleSaveEdit = useCallback((updated: AdminReview) => {
    setReviews((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      saveReviews(next);
      return next;
    });
    setEditItem(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setReviews((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveReviews(next);
      return next;
    });
    setDeleteConfirm(null);
  }, []);

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

        <main className="flex-1 overflow-y-auto">
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
                  <span className="hidden md:inline">Add Review</span>
                </Button>
              }
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
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-start)]">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Author</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Review</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Attachments</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {reviews.map((review) => (
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
                            <div className="flex items-center gap-1">
                              {review.collection.length > 0 && (
                                <button
                                  onClick={() => setLightbox({ items: review.collection, index: 0 })}
                                  className="flex size-8 items-center justify-center rounded-md text-xs text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                                  title="View collection"
                                >
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
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
                  {reviews.map((review) => (
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
                          {review.collection.length > 0 && (
                            <button
                              onClick={() => setLightbox({ items: review.collection, index: 0 })}
                              className="flex size-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                              title="View collection"
                            >
                              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
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
          open
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
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
