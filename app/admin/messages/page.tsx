'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { AdminSummaryGrid } from '@/components/admin/shared/admin-insights-ui';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { fetchAdminMessages, updateAdminMessageReadState } from '@/lib/services/admin-messages';
import type { AdminContactMessageItem } from '@/types/content';
import { useToast } from '@/hooks/use-toast';

const ADMIN_MESSAGES_UPDATED_EVENT = 'admin-messages-updated';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

interface MessageDetailModalProps {
  open: boolean;
  message: AdminContactMessageItem | null;
  onClose: () => void;
  onToggleRead: (message: AdminContactMessageItem) => Promise<void>;
}

function MessageDetailModal({ open, message, onClose, onToggleRead }: MessageDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (!overlayRef.current || !panelRef.current) return;

    document.body.style.overflow = 'hidden';
    const cleanup = () => { document.body.style.overflow = ''; };
    overlayRef.current.style.opacity = '0';
    panelRef.current.style.opacity = '0';
    const frame = window.requestAnimationFrame(() => {
      if (overlayRef.current) overlayRef.current.style.opacity = '1';
      if (panelRef.current) panelRef.current.style.opacity = '1';
      if (panelRef.current) panelRef.current.style.transform = 'scale(1)';
    });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKey);
      cleanup();
    };
  }, [open, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open || !message) return null;

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="flex max-h-[85vh] w-full max-w-2xl scale-95 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl transition-[transform,opacity]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--text)]">{message.name}</h3>
            <a
              href={`mailto:${message.email}`}
              className="mt-0.5 block truncate text-xs text-amber-200/80 hover:text-amber-200"
            >
              {message.email}
            </a>
          </div>
          <button
            onClick={handleClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-dim)]">
            <span className={`rounded-full px-2 py-0.5 font-medium ${message.isRead ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
              {message.isRead ? 'Read' : 'Unread'}
            </span>
            <span>Received {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
            <span>{format(new Date(message.createdAt), 'dd MMM yyyy')}</span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--button)] p-4 md:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">
              {message.message}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onToggleRead(message)}
              className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
            >
              {message.isRead ? 'Mark as Unread' : 'Mark as Read'}
            </Button>
            <a
              href={`mailto:${message.email}`}
              className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
            >
              Reply by Email
            </a>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            className="border border-[var(--border)]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default function MessagesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarExpanded(window.innerWidth >= 1280);
      setIsMobile(window.innerWidth < 1024);
    }
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<AdminContactMessageItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/messages');
      router.replace('/admin/login');
    }
  }, [router]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchAdminMessages(120);
      setMessages(rows);
      setSelectedId((prev) => prev || rows[0]?.id || null);
      window.dispatchEvent(new Event(ADMIN_MESSAGES_UPDATED_EVENT));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages();
    });
  }, [loadMessages]);

  useEffect(() => {
    const check = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleToggleSidebar = () => {
    manualToggleRef.current = true;
    if (isMobile) {
      const next = !mobileSidebarOpen;
      setMobileSidebarOpen(next);
      document.body.style.overflow = next ? 'hidden' : '';
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  };

  const filteredMessages = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return messages.filter((item) => {
      if (filter === 'unread' && item.isRead) return false;
      if (filter === 'read' && !item.isRead) return false;

      if (!keyword) return true;

      return (
        item.name.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.message.toLowerCase().includes(keyword)
      );
    });
  }, [messages, query, filter]);

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedId) || null,
    [messages, selectedId],
  );

  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter((item) => !item.isRead).length;
    const read = total - unread;
    return { total, unread, read };
  }, [messages]);

  const handleSelect = async (item: AdminContactMessageItem) => {
    setSelectedId(item.id);
    setDetailOpen(true);
    if (item.isRead) return;

    setMessages((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));

    try {
      await updateAdminMessageReadState(item.id, true);
      window.dispatchEvent(new Event(ADMIN_MESSAGES_UPDATED_EVENT));
    } catch {
      setMessages((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: false } : entry)));
      toast.error('Failed to mark message as read');
    }
  };

  const handleToggleRead = useCallback(async (message: AdminContactMessageItem) => {
    const nextIsRead = !message.isRead;

    setMessages((prev) => prev.map((entry) => (entry.id === message.id ? { ...entry, isRead: nextIsRead } : entry)));

    try {
      await updateAdminMessageReadState(message.id, nextIsRead);
      window.dispatchEvent(new Event(ADMIN_MESSAGES_UPDATED_EVENT));
    } catch {
      setMessages((prev) => prev.map((entry) => (entry.id === message.id ? { ...entry, isRead: message.isRead } : entry)));
      toast.error('Failed to update message status');
    }
  }, [toast]);

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
              title="Messages"
              description="Review and respond to contact form submissions"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void loadMessages()}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  Refresh
                </Button>
              }
            />

            <AdminSummaryGrid
              items={[
                { label: 'Total', value: stats.total },
                { label: 'Unread', value: stats.unread },
                { label: 'Read', value: stats.read },
              ]}
            />

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="w-full md:max-w-sm">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, email, or message"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilter(option.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        filter === option.id
                          ? 'bg-[var(--button-hover)] text-[var(--text)]'
                          : 'bg-[var(--button)] text-[var(--text-dim)] hover:text-[var(--text)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
                <div className="max-h-[65vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center p-3">
                      <p className="text-sm text-[var(--text-dim)]">Loading messages...</p>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-3">
                      <p className="text-sm text-[var(--text-dim)]">No messages found.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg-start)]">
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Sender</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Message</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Status</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredMessages.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => void handleSelect(item)}
                            className="cursor-pointer bg-[var(--bg-mid)]/30 align-top transition-colors odd:bg-[var(--bg-start)]/30 hover:bg-[var(--bg-start)]"
                          >
                            <td className="px-4 py-3">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-[var(--text)]">{item.name}</p>
                              <p className="max-w-[240px] truncate text-[11px] text-[var(--text-muted)]">{item.email}</p>
                            </td>
                            <td className="max-w-xs px-4 py-3">
                              <p className="line-clamp-2 text-[var(--text-muted)]">
                                {item.message}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.isRead ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
                                {item.isRead ? 'Read' : 'Unread'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[var(--text-dim)]">
                              <p>{format(new Date(item.createdAt), 'dd MMM yyyy')}</p>
                              <p>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredMessages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleSelect(item)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4 text-left transition-colors hover:bg-[var(--bg-mid)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--text)]">{item.name}</p>
                        <p className="truncate text-xs text-[var(--text-dim)]">{item.email}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.isRead ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
                        {item.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-[var(--text-muted)]">
                      {item.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-dim)]">
                      <span>{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <MessageDetailModal
              open={detailOpen}
              message={selectedMessage}
              onClose={() => setDetailOpen(false)}
              onToggleRead={handleToggleRead}
            />
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}