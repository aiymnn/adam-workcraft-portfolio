'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { AdminSummaryGrid } from '@/components/admin/shared/admin-insights-ui';
import { Button } from '@/components/ui/button';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { fetchEligibleForReviewBookings, sendReviewEmail } from '@/lib/services/admin-pending-reviews';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/types/booking';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function PendingReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const manualToggleRef = useRef(false);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/reviews/pending');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };
    setSidebarExpanded(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchEligibleForReviewBookings();
      setBookings(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleSidebar = useCallback(() => {
    manualToggleRef.current = true;
    if (isMobile) {
      const next = !mobileSidebarOpen;
      setMobileSidebarOpen(next);
      document.body.style.overflow = next ? 'hidden' : '';
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  }, [isMobile, mobileSidebarOpen]);

  const handleSendEmail = useCallback(async (booking: Booking) => {
    setSendingId(booking.id);
    try {
      const result = await sendReviewEmail(booking.id);
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? result.booking : b)));

      if (result.email.success) {
        toast.success(`Review invite sent to ${booking.email}`);
      } else {
        toast.error(`Code generated but email failed: ${result.email.message}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSendingId(null);
    }
  }, [toast]);

  const handleCopyCode = useCallback((code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  }, [toast]);

  const handleCopyLink = useCallback((code: string) => {
    const link = `${SITE_URL}/submit-review?code=${encodeURIComponent(code)}`;
    void navigator.clipboard.writeText(link);
    toast.success('Review link copied');
  }, [toast]);

  const withCode = bookings.filter((b) => b.reviewCode);
  const withoutCode = bookings.filter((b) => !b.reviewCode);

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
              title="Pending Reviews"
              description="Send review invites to clients whose bookings have been completed"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void load()}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  Refresh
                </Button>
              }
            />

            <AdminSummaryGrid
              items={[
                { label: 'Awaiting Invite', value: withoutCode.length },
                { label: 'Invite Sent', value: withCode.length },
                { label: 'Total Pending', value: bookings.length },
              ]}
            />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]/40" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]/20 py-20 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-emerald-800/40 bg-emerald-900/20">
                  <svg className="size-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text)]">All caught up!</p>
                <p className="mt-1 text-xs text-[var(--text-dim)]">
                  No confirmed bookings are waiting for a review invite.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const isSending = sendingId === booking.id;
                  const hasCode = Boolean(booking.reviewCode);

                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] transition-colors hover:bg-[var(--bg-mid)]/40"
                    >
                      {/* Desktop layout */}
                      <div className="hidden items-center gap-4 px-5 py-4 md:flex">
                        {/* Client info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-[var(--text)]">{booking.name}</p>
                            {hasCode ? (
                              <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                                Invite sent
                              </span>
                            ) : (
                              <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-400">
                                Not sent
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[var(--text-dim)]">{booking.email}</p>
                        </div>

                        {/* Service & date */}
                        <div className="hidden w-48 shrink-0 md:block">
                          <p className="truncate text-sm text-[var(--text-muted)]">{booking.service}</p>
                          <p className="text-xs text-[var(--text-dim)]">
                            {format(new Date(booking.date), 'dd MMM yyyy')} &bull;{' '}
                            {formatDistanceToNow(new Date(booking.date), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Code display */}
                        {hasCode && (
                          <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
                            <code className="rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-1.5 text-xs font-bold tracking-widest text-amber-400">
                              {booking.reviewCode}
                            </code>
                            <button
                              onClick={() => handleCopyCode(booking.reviewCode)}
                              title="Copy code"
                              className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleCopyLink(booking.reviewCode)}
                              title="Copy review link"
                              className="flex size-7 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex shrink-0 gap-2">
                          {hasCode && (
                            <button
                              onClick={() => void handleSendEmail(booking)}
                              disabled={isSending}
                              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                              </svg>
                              {isSending ? 'Sending…' : 'Resend'}
                            </button>
                          )}
                          <button
                            onClick={() => void handleSendEmail(booking)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSending ? (
                              <>
                                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Sending…
                              </>
                            ) : (
                              <>
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                                {hasCode ? 'Resend Email' : 'Send Invite'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Mobile layout */}
                      <div className="flex flex-col gap-4 p-4 md:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text)]">{booking.name}</p>
                            <p className="mt-0.5 truncate text-xs text-[var(--text-dim)]">{booking.email}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{booking.service}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {hasCode ? (
                              <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Invite sent</span>
                            ) : (
                              <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-400">Not sent</span>
                            )}
                            <span className="text-xs text-[var(--text-dim)]">{format(new Date(booking.date), 'dd MMM yyyy')}</span>
                          </div>
                        </div>

                        {hasCode && (
                          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2">
                            <code className="flex-1 text-xs font-bold tracking-widest text-amber-400">{booking.reviewCode}</code>
                            <button onClick={() => handleCopyCode(booking.reviewCode)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                              </svg>
                            </button>
                            <button onClick={() => handleCopyLink(booking.reviewCode)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => void handleSendEmail(booking)}
                          disabled={isSending}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                          {isSending ? 'Sending…' : hasCode ? 'Resend Invite' : 'Send Invite'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
}
