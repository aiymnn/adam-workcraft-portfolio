'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import type { StoryLoopImagePublicItem } from '@/types/content';
import {
  createAdminStoryLoopImage,
  deleteAdminStoryLoopImage,
  fetchAdminStoryLoopImages,
} from '@/lib/services/admin-story-loop-logos';
import { deleteAdminMediaByUrl, uploadAdminMedia } from '@/lib/services/admin-media';
import {
  MIN_STORY_LOOP_LOGOS,
} from '@/lib/story-loop-logos';
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon, ImageIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageHeader, AdminPageShell } from '@/components/admin/admin-page-layout';
import { VaultLoadingSkeleton } from '@/components/admin/loading';
import { MediaDropzone } from '@/components/admin/gallery/media-dropzone';
import { GallerySummaryGrid } from '@/components/admin/gallery/gallery-shared-ui';
import { useToast } from '@/hooks/use-toast';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function isDriveManagedUrl(value: string): boolean {
  return /\/api\/media\//i.test(value);
}

function preloadStoryImage(src: string): Promise<void> {
  if (typeof window === 'undefined' || !src) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

interface StoryImagePreviewModalProps {
  src: string;
  name: string;
  onClose: () => void;
}

function StoryImagePreviewModal({ src, name, onClose }: StoryImagePreviewModalProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-20 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] text-sm text-[var(--text)] md:size-9"
        >
          &#x2715;
        </button>

        <div className="relative w-full">
          {!ready && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/55 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" />
                </svg>
                Loading preview...
              </div>
            </div>
          )}

          <Image
            src={src}
            alt={name || 'Story image preview'}
            width={1600}
            height={900}
            unoptimized
            onLoad={() => setReady(true)}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}

interface AddStoryImageDialogProps {
  open: boolean;
  saving: boolean;
  minRequiredUploadCount: number;
  onSave: (payload: { pendingFiles: File[] }) => void;
  onClose: () => void;
}

function AddStoryImageDialog({ open, saving, minRequiredUploadCount, onSave, onClose }: AddStoryImageDialogProps) {
  const [pendingEntries, setPendingEntries] = useState<Array<{ id: string; file: File; previewUrl: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPendingEntries((prev) => {
      prev.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
      return [];
    });
  }, [open]);

  useEffect(() => {
    return () => {
      pendingEntries.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, [pendingEntries]);

  const isSaveDisabled = useMemo(() => {
    if (saving) return true;
    if (pendingEntries.length < Math.max(1, minRequiredUploadCount)) return true;
    return false;
  }, [pendingEntries.length, saving, minRequiredUploadCount]);

  const setPendingFromFiles = useCallback((files: File[]) => {
    const nextEntries = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingEntries((prev) => [...prev, ...nextEntries]);
  }, []);

  const queueImageFiles = useCallback((files: File[]) => {
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const rejectedCount = files.length - imageFiles.length;

    if (!imageFiles.length) {
      toast.error('Only image files are supported for Story loop images.');
      return;
    }

    setPendingFromFiles(imageFiles);
    if (rejectedCount > 0) {
      toast.info(`${imageFiles.length} image(s) queued. ${rejectedCount} file(s) skipped.`);
    } else {
      toast.success(`${imageFiles.length} image(s) ready. They will upload on Save.`);
    }
  }, [setPendingFromFiles, toast]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueImageFiles(files);
  }, [queueImageFiles]);

  const handleDropImage = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    queueImageFiles(files);
  }, [queueImageFiles]);

  const handleRemovePending = useCallback((id: string) => {
    setPendingEntries((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const openImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:mx-4 sm:max-w-xl sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">Add Story Loop Image</h3>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] sm:size-8"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-start)] px-3 py-2 text-xs text-[var(--text-dim)]">
            Upload image from your Drive media flow. External links are not used here.
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-dim)]">Story Image</label>
              <button
                type="button"
                onClick={openImagePicker}
                disabled={saving}
                className="min-h-9 rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-60"
              >
                Upload Image
              </button>
            </div>

            <MediaDropzone
              title="Drop image file here"
              hint="Drag an image or click to upload"
              icon="image"
              onDrop={handleDropImage}
              onClick={openImagePicker}
              className="mb-3"
            />

            <div className="scrollbar-hidden max-h-64 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-start)] p-2">
              {pendingEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--text-dim)]">No media yet. Upload from your device.</p>
              ) : (
                pendingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] p-2 transition-colors hover:border-amber-700/30"
                  >
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-black">
                      <Image
                        src={entry.previewUrl}
                        alt="Story loop image preview"
                        fill
                        unoptimized
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-dim)]">{entry.file.name || 'story-image'}</p>
                    <button
                      type="button"
                      onClick={() => handleRemovePending(entry.id)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                      title="Remove"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-[10px] text-[var(--text-dim)]">
              {minRequiredUploadCount > 1
                ? `Select at least ${minRequiredUploadCount} images to enable Save.`
                : 'Select at least 1 image to enable Save.'}
            </p>
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
            onClick={() => {
              if (!pendingEntries.length) return;
              onSave({ pendingFiles: pendingEntries.map((entry) => entry.file) });
            }}
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

export default function StoryLoopImagesPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [logos, setLogos] = useState<StoryLoopImagePublicItem[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<StoryLoopImagePublicItem | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const deriveImageName = useCallback((payload: {
    name?: string;
    pendingFile?: File | null;
    src?: string;
    fallbackIndex?: number;
  }) => {
    const trimmedName = (payload.name || '').trim();
    if (trimmedName) return trimmedName;

    const fileName = (payload.pendingFile?.name || '').trim();
    if (fileName) {
      return fileName.replace(/\.[^.]+$/, '').trim() || 'Story Image';
    }

    const srcPart = (payload.src || '').split('/').pop() || '';
    const decodedSrc = decodeURIComponent(srcPart).replace(/\.[^.]+$/, '').trim();
    if (decodedSrc) return decodedSrc;

    if (typeof payload.fallbackIndex === 'number' && Number.isFinite(payload.fallbackIndex)) {
      return `Story Image ${Math.max(1, payload.fallbackIndex + 1)}`;
    }

    return 'Story Image';
  }, []);

  const createProfessionalFileName = useCallback((name: string, file: File) => {
    const extFromName = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
    const extFromType = file.type.includes('/') ? file.type.split('/')[1] : '';
    const ext = (extFromName || extFromType || 'png').toLowerCase();
    const safeName = name.trim() || 'story-image';
    const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'story-image';
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 7);
    return `story-loop-image-${slug}-${stamp}-${random}.${ext}`;
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!isAuthenticated()) {
        setLastPage('/admin/gallery/story-loop-images');
        router.push('/admin/login');
        return;
      }

      try {
        const rows = await fetchAdminStoryLoopImages();
        if (!active) return;
        setLogos(rows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Failed to load story loop images');
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
    setIsAddModalOpen(true);
  }, []);

  const handleSaveAdd = useCallback(async (payload: { pendingFiles: File[] }) => {
    if (isSavingAdd) return;
    setIsSavingAdd(true);

    const uploadedUrls: string[] = [];

    try {
      const createdItems: StoryLoopImagePublicItem[] = [];

      for (let index = 0; index < payload.pendingFiles.length; index += 1) {
        const file = payload.pendingFiles[index];
        const normalizedName = deriveImageName({
          pendingFile: file,
          fallbackIndex: logos.length + index,
        });

        const src = await uploadAdminMedia(file, {
          fileName: createProfessionalFileName(normalizedName, file),
        });

        uploadedUrls.push(src);

        if (!src.trim()) {
          throw new Error('Image is required');
        }

        const created = await createAdminStoryLoopImage({
          name: normalizedName,
          src,
        });
        createdItems.push(created);
      }

      setLogos((prev) => [...prev, ...createdItems].sort((a, b) => a.order - b.order));
      setIsAddModalOpen(false);
      toast.success(`${payload.pendingFiles.length} Story loop image(s) added`);
    } catch (error) {
      if (uploadedUrls.length > 0) {
        await Promise.allSettled(uploadedUrls.map((url) => deleteAdminMediaByUrl(url)));
      }
      toast.error(error instanceof Error ? error.message : 'Failed to add story loop image');
    } finally {
      setIsSavingAdd(false);
    }
  }, [createProfessionalFileName, deriveImageName, isSavingAdd, logos.length, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const previous = logos;
    setLogos((prev) => prev.filter((item) => item.id !== id));
    setDeleteConfirm(null);

    try {
      await deleteAdminStoryLoopImage(id);
      toast.success('Story loop image deleted');
    } catch (error) {
      setLogos(previous);
      toast.error(error instanceof Error ? error.message : 'Failed to delete story loop image');
    }
  }, [logos, toast]);

  const handleOpenPreview = useCallback(async (item: StoryLoopImagePublicItem) => {
    setPreviewLoadingId(item.id);
    await preloadStoryImage(item.src);
    setPreviewItem(item);
    setPreviewLoadingId(null);
  }, []);

  const stats = useMemo(() => {
    const driveManaged = logos.filter((item) => isDriveManagedUrl(item.src)).length;

    return {
      total: logos.length,
      driveManaged,
    };
  }, [logos]);

  const minimumMissingCount = Math.max(0, MIN_STORY_LOOP_LOGOS - stats.total);
  const isFallbackActive = minimumMissingCount > 0;
  const canDeleteAny = stats.total > MIN_STORY_LOOP_LOGOS;

  const sortedLogos = useMemo(
    () => [...logos].sort((a, b) => a.order - b.order),
    [logos],
  );

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
            onClose={() => {
              setMobileSidebarOpen(false);
              document.body.style.overflow = '';
            }}
          />
        ) : (
          <DesktopSidebar expanded={sidebarExpanded} />
        )}

        <main className="scrollbar-hidden flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title="Story Loop Images"
              description="Manage the animated looping images shown in the Story section on the landing page"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddNew}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <PlusIcon />
                  <span>Add Image</span>
                </Button>
              }
            />

            {isBootstrapping ? (
              <VaultLoadingSkeleton />
            ) : (
              <>
                <GallerySummaryGrid
                  items={[
                    { label: 'Total Images', value: stats.total },
                    { label: 'Drive Managed', value: stats.driveManaged },
                    { label: 'Visible Rows', value: Math.ceil(Math.max(stats.total, 1) / 6) },
                    { label: 'Minimum Needed', value: MIN_STORY_LOOP_LOGOS },
                  ]}
                />

                {isFallbackActive && (
                  <div className="rounded-xl border border-amber-900/40 bg-amber-900/15 px-4 py-3 text-xs text-amber-100/90">
                    <p className="font-medium text-amber-100">Landing fallback is active.</p>
                    <p className="mt-1 text-amber-200/80">
                      Add at least {minimumMissingCount} more image{minimumMissingCount === 1 ? '' : 's'} to reach the minimum of {MIN_STORY_LOOP_LOGOS}. Until then,
                      the Story section keeps using default animated images so the landing page stays full.
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-4 py-3 text-xs text-[var(--text-dim)]">
                  This list is Drive-only. Use Add Image to upload and store new Story loop images.
                </div>

                {logos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-16 text-center">
                    <ImageIcon className="size-10 text-[var(--text-dim)]" />
                    <p className="mt-3 text-sm font-medium text-[var(--text)]">No Story loop images yet</p>
                    <p className="mt-1 text-xs text-[var(--text-dim)]">
                      Add images here to control what appears in the landing Story section animation.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddNew}
                      className="mt-4 border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    >
                      <PlusIcon />
                      <span>Add Image</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedLogos.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 transition-colors hover:border-[var(--button-hover)]"
                      >
                        <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-black sm:h-40">
                          <Image
                            src={item.src}
                            alt={item.name}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>

                        <div className="mt-3 space-y-1">
                          <p className="truncate text-sm font-medium text-[var(--text)]">{item.name}</p>
                          <p className="truncate text-[11px] text-[var(--text-dim)]">{item.src}</p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => void handleOpenPreview(item)}
                            disabled={previewLoadingId === item.id}
                            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-60"
                          >
                            {previewLoadingId === item.id ? 'Opening...' : 'Preview'}
                          </button>

                          {deleteConfirm === item.id ? (
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={!canDeleteAny}
                              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-md border border-red-900/50 bg-red-900/30 px-2.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/45"
                              title={canDeleteAny ? 'Confirm delete' : `Minimum ${MIN_STORY_LOOP_LOGOS} images required`}
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              disabled={!canDeleteAny}
                              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-dim)] transition-colors hover:bg-red-900/35 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              title={canDeleteAny ? 'Delete image' : `Minimum ${MIN_STORY_LOOP_LOGOS} images required`}
                            >
                              {canDeleteAny ? 'Delete' : 'Min Reached'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </AdminPageShell>
        </main>
      </div>

      <AddStoryImageDialog
        open={isAddModalOpen}
        saving={isSavingAdd}
        minRequiredUploadCount={Math.max(1, MIN_STORY_LOOP_LOGOS - logos.length)}
        onSave={handleSaveAdd}
        onClose={() => setIsAddModalOpen(false)}
      />

      {previewItem && (
        <StoryImagePreviewModal
          src={previewItem.src}
          name={previewItem.name}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
