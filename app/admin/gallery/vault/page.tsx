'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { loadVaultCollections, saveVaultCollections, generateId, type VaultCollection } from '@/lib/services/vault';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { PlusIcon, XIcon, EditIcon, ImageIcon, ExternalLinkIcon } from '@/components/shared/icons';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { VaultLoadingSkeleton } from '@/components/admin/loading';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Photography', label: 'Photography' },
  { value: 'Videography', label: 'Videography' },
];

const WIDTH_OPTIONS: SelectOption[] = [
  { value: '1', label: '1 Col' },
  { value: '2', label: '2 Cols' },
  { value: '3', label: '3 Cols' },
];

const HEIGHT_OPTIONS: SelectOption[] = [
  { value: '1', label: '1 Row' },
  { value: '2', label: '2 Rows' },
];

const SPAN_LABELS: Record<number, string> = {
  1: 'Standard',
  2: 'Wide',
  3: 'Full',
};

const ROW_LABELS: Record<number, string> = {
  1: 'Standard',
  2: 'Tall',
};

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

interface VaultRowProps {
  item: VaultCollection;
  index: number;
  total: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdate: (id: string, updates: Partial<VaultCollection>) => void;
  onEdit: (item: VaultCollection) => void;
  onDelete: (id: string) => void;
}

function VaultRow({ item, index, total, onMoveUp, onMoveDown, onUpdate, onEdit, onDelete }: VaultRowProps) {
  const isVideo = item.isVideo;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] transition-colors hover:border-[var(--button-hover)]">
      <div className="flex flex-col md:flex-row md:items-center md:gap-3 md:p-3">
        <div className="flex items-center gap-1.5 px-4 pt-4 md:px-0 md:pt-0">
          <button
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-20"
            title="Move up"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown(item.id)}
            disabled={index === total - 1}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:opacity-20"
            title="Move down"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <span className="ml-1 w-5 text-xs font-medium text-[var(--text-dim)]">{index + 1}</span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-3 md:px-0 md:pt-0">
          <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-[var(--button)] md:size-10">
            {isVideo ? (
              <div className="flex size-full items-center justify-center text-[var(--text-dim)]">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            ) : (
              <img src={item.thumb} alt="" className="size-full object-cover" loading="lazy" />
            )}
          </div>
          <span className="truncate text-sm font-medium text-[var(--text)]">{item.title}</span>
        </div>

        <input
          value={item.title}
          onChange={(e) => onUpdate(item.id, { title: e.target.value })}
          className="mx-4 mt-3 hidden min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-1.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30 md:mx-0 md:mt-0 md:block"
          placeholder="Collection title"
        />

        <div className="mx-4 mt-3 hidden md:mx-0 md:mt-0 md:block">
          <Select
            value={item.category}
            options={CATEGORY_OPTIONS}
            onChange={(val) => onUpdate(item.id, { category: val as 'Photography' | 'Videography' })}
            className="w-32"
          />
        </div>

        <div className="mx-4 mt-3 hidden md:mx-0 md:mt-0 md:flex md:items-center md:gap-2">
          <Select
            value={String(item.columnSpan)}
            options={WIDTH_OPTIONS}
            onChange={(val) => onUpdate(item.id, { columnSpan: Number(val) })}
            className="w-24"
          />
          <Select
            value={String(item.rowSpan)}
            options={HEIGHT_OPTIONS}
            onChange={(val) => onUpdate(item.id, { rowSpan: Number(val) })}
            className="w-24"
          />
        </div>

        <div className="mx-4 mt-3 hidden md:mx-0 md:mt-0 md:flex md:items-center md:gap-1">
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
            <span className="mx-2">&middot;</span>
            <span className="text-[var(--text-dim)]">Width:</span> {SPAN_LABELS[item.columnSpan] ?? item.columnSpan}
            <span className="mx-2">&middot;</span>
            <span className="text-[var(--text-dim)]">Height:</span> {ROW_LABELS[item.rowSpan] ?? item.rowSpan}
          </p>
        </div>
        <div className="flex gap-3">
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

const EMPTY_FORM: VaultCollection = {
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
  item: VaultCollection;
  onSave: (item: VaultCollection) => void;
  onClose: () => void;
}

function EditDialog({ open, item, onSave, onClose }: EditDialogProps) {
  const [form, setForm] = useState<VaultCollection>(item);

  useEffect(() => {
    setForm(item);
  }, [item]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim() });
  };

  const handleMediaChange = (val: string) => {
    const urls = val.split('\n').map((s) => s.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, media: urls }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] p-5 shadow-2xl sm:mx-4 sm:max-w-lg sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {item.id ? 'Edit Collection' : 'New Collection'}
          </h3>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)]"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-3">
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
                options={CATEGORY_OPTIONS}
                onChange={(val) => setForm((prev) => ({ ...prev, category: val as 'Photography' | 'Videography' }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Card Width</label>
              <Select
                value={String(form.columnSpan)}
                options={WIDTH_OPTIONS}
                onChange={(val) => setForm((prev) => ({ ...prev, columnSpan: Number(val) }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Card Height</label>
              <Select
                value={String(form.rowSpan)}
                options={HEIGHT_OPTIONS}
                onChange={(val) => setForm((prev) => ({ ...prev, rowSpan: Number(val) }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">Thumbnail URL</label>
            <input
              value={form.thumb}
              onChange={(e) => setForm((prev) => ({ ...prev, thumb: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isVideo}
                onChange={(e) => setForm((prev) => ({ ...prev, isVideo: e.target.checked }))}
                className="size-4 accent-amber-700"
              />
              <span className="text-xs font-medium text-[var(--text-dim)]">Video collection</span>
            </label>
          </div>

          {form.isVideo && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">
                Videos ({form.videos?.length ?? 0})
              </label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--button)] p-2">
                {(form.videos ?? []).map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => {
                        const next = [...(form.videos ?? [])];
                        next[i] = e.target.value;
                        setForm((prev) => ({ ...prev, videos: next }));
                      }}
                      className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-start)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
                      placeholder="/video.mp4"
                    />
                    <button
                      onClick={() => {
                        const next = (form.videos ?? []).filter((_, j) => j !== i);
                        setForm((prev) => ({ ...prev, videos: next }));
                      }}
                      className="flex shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] px-2 text-[var(--text-dim)] transition-colors hover:bg-red-900/40 hover:text-red-300"
                      title="Remove video"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForm((prev) => ({ ...prev, videos: [...(prev.videos ?? []), ''] }))}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border)] bg-transparent px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <PlusIcon className="size-3.5" />
                  Add Video
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-dim)]">
              Media URLs (one per line)
            </label>
            <textarea
              value={form.media.join('\n')}
              onChange={(e) => handleMediaChange(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-amber-700/50 focus:ring-1 focus:ring-amber-700/30"
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
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

export default function PersonalVaultPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [editItem, setEditItem] = useState<VaultCollection | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLastPage('/admin/gallery/vault');
      router.push('/admin/login');
      return;
    }
    setCollections(loadVaultCollections());
    setIsBootstrapping(false);
  }, [router]);

  const sortedCollections = useMemo(
    () => [...collections].sort((a, b) => a.order - b.order),
    [collections],
  );

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

  const handleMoveUp = useCallback((id: string) => {
    setCollections((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
      const next = sorted.map((c, i) => ({ ...c, order: i }));
      saveVaultCollections(next);
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setCollections((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((c) => c.id === id);
      if (idx === -1 || idx >= sorted.length - 1) return prev;
      [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
      const next = sorted.map((c, i) => ({ ...c, order: i }));
      saveVaultCollections(next);
      return next;
    });
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<VaultCollection>) => {
    setCollections((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveVaultCollections(next);
      return next;
    });
  }, []);

  const handleEdit = useCallback((item: VaultCollection) => {
    setEditItem(item);
  }, []);

  const handleSaveEdit = useCallback((updated: VaultCollection) => {
    setCollections((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      saveVaultCollections(next);
      return next;
    });
    setEditItem(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setCollections((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      const next = filtered.map((c, i) => ({ ...c, order: i }));
      saveVaultCollections(next);
      return next;
    });
  }, []);

  const handleAddNew = useCallback(() => {
    const newItem: VaultCollection = {
      ...EMPTY_FORM,
      id: generateId(),
      order: collections.length,
    };
    setCollections((prev) => {
      const next = [...prev, newItem];
      saveVaultCollections(next);
      return next;
    });
    setEditItem(newItem);
  }, [collections.length]);

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
              title="Personal Vault"
              description="Reorder your vault collections. The order here controls the landing page display."
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddNew}
                  className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <PlusIcon />
                  <span>Add</span>
                </Button>
              }
            />

            {isBootstrapping ? (
              <VaultLoadingSkeleton />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 md:gap-3">
                  <p className="text-xs text-[var(--text-dim)]">
                    Collections appear in this order on the landing page. Use
                    <span className="mx-1 inline-flex align-middle">
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                    to rearrange.
                  </p>
                  <button
                    onClick={() => window.open('/', '_blank')}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    View Live Site
                  </button>
                </div>

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
                ) : (
                  <div className="space-y-2">
                    {sortedCollections.map((item, index) => (
                      <VaultRow
                        key={item.id}
                        item={item}
                        index={index}
                        total={sortedCollections.length}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onUpdate={handleUpdate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
          open
          item={editItem}
          onSave={handleSaveEdit}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
