'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import type { PublicCollectionItem } from '@/lib/services/admin-public-collection';
import {
  fetchAdminPublicCollection,
  createAdminPublicCollectionItem,
  deleteAdminPublicCollectionItem,
  updateAdminPublicCollectionItem,
  reorderAdminPublicCollection,
} from '@/lib/services/admin-public-collection';
import { deleteAdminMediaByUrl, uploadAdminMedia } from '@/lib/services/admin-media';
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

interface AddItemDialogProps {
  open: boolean;
  saving: boolean;
  existingItems: PublicCollectionItem[];
  onSave: (payload: { pendingFiles: File[]; section: 'about' | 'expertise' }) => void;
  onClose: () => void;
}

function AddItemDialog({ open, saving, existingItems, onSave, onClose }: AddItemDialogProps) {
  const [pendingEntries, setPendingEntries] = useState<Array<{ id: string; file: File; previewUrl: string }>>([]);
  const [section, setSection] = useState<'about' | 'expertise'>('about');
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
    if (pendingEntries.length === 0) return true;
    return false;
  }, [pendingEntries.length, saving]);

  const setPendingFromFiles = useCallback((files: File[]) => {
    const nextEntries = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingEntries((prev) => [...prev, ...nextEntries]);
  }, []);

  const queueFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    const mediaFiles = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    const rejectedCount = files.length - mediaFiles.length;

    if (section === 'expertise') {
      const existingVideos = existingItems.filter(i => i.section === 'expertise' && i.type === 'video').length;
      const existingImages = existingItems.filter(i => i.section === 'expertise' && i.type === 'image').length;

      const newVideos = mediaFiles.filter(f => f.type.startsWith('video/')).length;
      const newImages = mediaFiles.filter(f => f.type.startsWith('image/')).length;

      const pendingVideos = pendingEntries.filter(e => e.file.type.startsWith('video/')).length;
      const pendingImages = pendingEntries.filter(e => e.file.type.startsWith('image/')).length;

      if (existingVideos + pendingVideos + newVideos > 1) {
        toast.error('Expertise section can only have a maximum of 1 video.');
        return;
      }
      if (existingImages + pendingImages + newImages > 6) {
        toast.error('Expertise section can only have a maximum of 6 images.');
        return;
      }
    }

    setPendingFromFiles(mediaFiles);
    if (rejectedCount > 0) {
      toast.info(`${mediaFiles.length} media queued. ${rejectedCount} file(s) skipped.`);
    }
  }, [setPendingFromFiles, toast, section, existingItems, pendingEntries]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    queueFiles(files);
  }, [queueFiles]);

  const handleRemovePending = useCallback((id: string) => {
    setPendingEntries((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:mx-4 sm:max-w-xl sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <h3 className="text-sm font-semibold text-[var(--text)]">Add Media to Public Collection</h3>
          <button onClick={onClose} className="flex size-10 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)] sm:size-8"><XIcon /></button>
        </div>

        <div className="scrollbar-hidden flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileInput} />
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-dim)]">Assign to Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as any)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-start)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-amber-500/50"
            >
              <option value="about">About Section (Collage)</option>
              <option value="expertise">Expertise Section (Backgrounds)</option>
            </select>
          </div>

          <MediaDropzone title="Drop media here" hint="Images or Videos" icon="image" onDrop={(e) => { e.preventDefault(); queueFiles(Array.from(e.dataTransfer.files || [])); }} onClick={() => fileInputRef.current?.click()} className="mb-3" />

          <div className="scrollbar-hidden max-h-64 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-start)] p-2">
            {pendingEntries.length === 0 ? <p className="py-6 text-center text-xs text-[var(--text-dim)]">No media queued.</p> : pendingEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-mid)] p-2">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-black">
                  {entry.file.type.startsWith('video/') ? (
                    <video src={entry.previewUrl} className="h-full w-full object-cover" muted />
                  ) : (
                    <Image src={entry.previewUrl} alt="" fill unoptimized className="object-cover" />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-dim)]">{entry.file.name}</p>
                <button type="button" onClick={() => handleRemovePending(entry.id)} className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-red-900/40 hover:text-red-300"><XIcon className="size-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-4 py-4 sm:flex-row sm:px-5">
          <button onClick={onClose} disabled={saving} className="min-h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--button-hover)] disabled:opacity-60">Cancel</button>
          <button onClick={() => onSave({ pendingFiles: pendingEntries.map(e => e.file), section })} disabled={isSaveDisabled} className="min-h-10 flex-1 rounded-lg bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg-end)] hover:opacity-90 disabled:opacity-60">{saving ? 'Saving...' : 'Save Media'}</button>
        </div>
      </div>
    </div>
  );
}

export default function PublicCollectionPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mounted, setMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [items, setItems] = useState<PublicCollectionItem[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'expertise'>('about');
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!isAuthenticated()) {
        setLastPage('/admin/gallery/public-collection');
        router.push('/admin/login');
        return;
      }
      try {
        const rows = await fetchAdminPublicCollection();
        if (!active) return;
        setItems(rows);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Failed to load public collection');
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };
    void init();
    return () => { active = false; };
  }, [router, toast]);

  const handleSaveAdd = useCallback(async (payload: { pendingFiles: File[]; section: 'about' | 'expertise' }) => {
    if (isSavingAdd) return;
    setIsSavingAdd(true);

    try {
      const createdItems: PublicCollectionItem[] = [];
      for (let i = 0; i < payload.pendingFiles.length; i++) {
        const file = payload.pendingFiles[i];
        const title = file.name.replace(/\.[^.]+$/, '').trim();
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        const src = await uploadAdminMedia(file, { fileName: `public-${payload.section}-${Date.now()}-${i}` });
        if (!src) throw new Error('Upload failed');
        
        const created = await createAdminPublicCollectionItem({ title, src, type, section: payload.section });
        createdItems.push(created);
      }
      setItems((prev) => [...prev, ...createdItems]);
      setIsAddModalOpen(false);
      setActiveTab(payload.section);
      toast.success(`${payload.pendingFiles.length} item(s) added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add media');
    } finally {
      setIsSavingAdd(false);
    }
  }, [isSavingAdd, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeleteConfirm(null);
    try {
      await deleteAdminPublicCollectionItem(id);
      toast.success('Media deleted');
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  }, [items, toast]);

  const visibleItems = items.filter(i => i.section === activeTab).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMove = useCallback(async (index: number, direction: 'up' | 'down') => {
    if (isReordering) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === visibleItems.length - 1) return;

    setIsReordering(true);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...visibleItems];
    const temp = newItems[index];
    newItems[index] = newItems[newIndex];
    newItems[newIndex] = temp;

    const updates = newItems.map((item, i) => ({ id: item.id, sortOrder: i }));

    setItems((prev) => {
      const next = [...prev];
      for (const update of updates) {
        const match = next.find(x => x.id === update.id);
        if (match) match.sortOrder = update.sortOrder;
      }
      return next;
    });

    try {
      await reorderAdminPublicCollection(updates);
    } catch (error) {
      toast.error('Failed to save order');
      const rows = await fetchAdminPublicCollection();
      setItems(rows);
    } finally {
      setIsReordering(false);
    }
  }, [visibleItems, isReordering, toast]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader sidebarExpanded={sidebarExpanded} isMobile={isMobile} onToggleSidebar={() => isMobile ? setMobileSidebarOpen(!mobileSidebarOpen) : setSidebarExpanded(!sidebarExpanded)} />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {isMobile ? <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} /> : <DesktopSidebar expanded={sidebarExpanded} />}
        <main className="scrollbar-hidden flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader
              title="Public Collection"
              description="Manage images and videos used in the landing page (About grid, Expertise backgrounds, etc.)"
              actions={<Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)}><PlusIcon /><span>Add Media</span></Button>}
            />
            
            {isBootstrapping ? <VaultLoadingSkeleton /> : (
              <>
                <div className="flex space-x-2 border-b border-[var(--border)] mb-4">
                  <button onClick={() => setActiveTab('about')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'about' ? 'border-amber-500 text-[var(--text)]' : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}>About Section</button>
                  <button onClick={() => setActiveTab('expertise')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'expertise' ? 'border-amber-500 text-[var(--text)]' : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}>Expertise Section</button>
                </div>

                <GallerySummaryGrid items={[{ label: 'Total in Section', value: visibleItems.length }]} />

                {visibleItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-start)] px-6 py-16 text-center">
                    <ImageIcon className="size-10 text-[var(--text-dim)]" />
                    <p className="mt-3 text-sm font-medium text-[var(--text)]">No media in {activeTab}</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'about' && (
                      <div className="mb-8 rounded-xl border border-[var(--border)] bg-black/40 p-4 sm:p-6">
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-[var(--text)]">Collage Layout Preview</h3>
                          <p className="text-xs text-[var(--text-dim)]">The first 5 items map to these specific slots in the masonry collage. The grid adapts between mobile and desktop.</p>
                        </div>
                        <div className="grid h-[300px] w-full grid-cols-2 grid-rows-3 gap-2 sm:h-[400px] md:grid-cols-4 md:grid-rows-2">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const item = visibleItems[i];
                            const colClass = i === 1 ? 'md:col-span-2' : i === 2 ? 'col-span-2 md:col-span-1' : i === 3 ? 'md:col-span-2' : i === 4 ? 'md:col-span-2' : '';
                            return (
                              <div key={i} className={`relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-start)] ${colClass}`}>
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/10">
                                  <span className="rounded-md bg-black/80 px-2.5 py-1 text-xs font-bold text-amber-500 shadow-sm backdrop-blur-md">Slot {i + 1}</span>
                                </div>
                                {item ? (
                                  item.type === 'video' ? <video src={item.src} className="size-full object-cover opacity-60 grayscale-[0.3]" /> : <img src={item.src} className="size-full object-cover opacity-60 grayscale-[0.3]" alt="" />
                                ) : (
                                  <div className="flex size-full flex-col items-center justify-center text-[var(--text-dim)] opacity-50">
                                    <ImageIcon className="mb-1 size-5" />
                                    <span className="text-[10px] uppercase tracking-wider">Empty</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mt-4">
                    {visibleItems.map((item, index) => (
                      <div key={item.id} className="relative rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 transition-colors hover:border-[var(--button-hover)]">
                        {activeTab === 'about' && index < 5 && (
                          <div className="absolute -right-2 -top-2 z-20 flex size-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow-md ring-2 ring-[var(--bg-start)]">
                            {index + 1}
                          </div>
                        )}
                        <div className="relative h-40 overflow-hidden rounded-lg bg-black">
                          {item.type === 'video' ? <video src={item.src} className="h-full w-full object-cover" controls preload="metadata" /> : <Image src={item.src} alt={item.title || ''} fill unoptimized className="object-cover" />}
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="truncate text-[11px] text-[var(--text-dim)] uppercase">{item.type}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMove(index, 'up')}
                              disabled={index === 0 || isReordering}
                              className="flex size-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-mid)] text-[var(--text-dim)] hover:bg-[var(--button-hover)] disabled:opacity-30"
                              title="Move Up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMove(index, 'down')}
                              disabled={index === visibleItems.length - 1 || isReordering}
                              className="flex size-7 items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-mid)] text-[var(--text-dim)] hover:bg-[var(--button-hover)] disabled:opacity-30"
                              title="Move Down"
                            >
                              ↓
                            </button>
                          </div>
                          {deleteConfirm === item.id ? (
                            <button onClick={() => handleDelete(item.id)} className="rounded-md border border-red-900/50 bg-red-900/30 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-900/45">Confirm Delete</button>
                          ) : (
                            <button onClick={() => setDeleteConfirm(item.id)} className="rounded-md border border-[var(--border)] bg-[var(--button)] px-3 py-1 text-xs font-medium hover:bg-red-900/35 hover:text-red-300">Delete</button>
                          )}
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
      <AddItemDialog open={isAddModalOpen} saving={isSavingAdd} existingItems={items} onSave={handleSaveAdd} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
