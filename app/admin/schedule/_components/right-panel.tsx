'use client';

import { memo, useState, useCallback } from 'react';
import type { Booking } from './types';
import { STATUS_STYLES, STATUS_LABELS } from './types';
import { Button } from '@/components/ui/button';
import { PlusIcon, EditIcon } from '@/components/shared/icons';

interface RightPanelProps {
  selectedDate: Date;
  dateLabel: string;
  isToday: boolean;
  dayBookings: Booking[];
  bookingsCount: number;
  changingStatusId: string | null;
  onNewBooking: () => void;
  onEditBooking: (b: Booking) => void;
  onRequestStatusChange: (id: string, status: Booking['status']) => void;
  onGenerateReviewCode: (id: string) => void;
}

function CopyButton({ label, value, copiedLabel }: { label: string; value: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text-muted)]"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

const RightPanel = memo(function RightPanel({
  selectedDate,
  dateLabel,
  isToday,
  dayBookings,
  bookingsCount,
  changingStatusId,
  onNewBooking,
  onEditBooking,
  onRequestStatusChange,
  onGenerateReviewCode,
}: RightPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{dateLabel}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-dim)]">
            {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNewBooking}
          className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--text)] text-[var(--bg-end)] hover:bg-[var(--text-muted)]"
        >
          <PlusIcon />
          <span className="text-xs">New</span>
        </Button>
      </div>

      <div className="scrollbar-hidden flex-1 space-y-2 overflow-y-auto p-3">
        {dayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-dashed border-[var(--border)]">
              <svg className="size-5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-dim)]">No bookings for this day</p>
            <p className="mt-0.5 text-xs text-[var(--text-dim)]">Click + New to add one</p>
          </div>
        ) : (
          dayBookings.map((b) => (
            <div
              key={b.id}
              className={`rounded-lg border border-[var(--border)] bg-[var(--bg-end)]/20 p-3 transition-colors hover:bg-[var(--button)] ${
                changingStatusId === b.id ? 'ring-2 ring-emerald-500/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="shrink-0 rounded-md bg-[var(--button-hover)] px-1.5 py-0.5 text-xs font-bold tabular-nums">
                    {b.time}
                  </span>
                  <span className="truncate text-sm font-medium">{b.name}</span>
                  <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
                  <button
                    onClick={() => onEditBooking(b)}
                    className="shrink-0 rounded-md p-2 sm:p-1 text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                    aria-label="Edit booking"
                  >
                    <EditIcon className="size-4 sm:size-3.5" />
                  </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-dim)]">
                <span>{b.service}</span>
                <span>{b.email}</span>
              </div>

              {b.status === 'confirmed' && b.reviewCode && !b.reviewSubmitted && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-amber-900/20 px-2 py-1">
                  <span className="flex items-center gap-1 text-[11px] font-medium tracking-wider text-amber-300/90">
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    {b.reviewCode}
                  </span>
                  <div className="flex gap-1">
                    <CopyButton label="Copy" value={b.reviewCode} copiedLabel="Copied!" />
                    <CopyButton
                      label="Send Email"
                      value={`Your review code for ${b.name}: ${b.reviewCode}\n\nSubmit your review at: ${typeof window !== 'undefined' ? window.location.origin : ''}/submit-review?code=${b.reviewCode}`}
                      copiedLabel="Email copied!"
                    />
                  </div>
                </div>
              )}

              {b.status === 'confirmed' && !b.reviewCode && (
                <div className="mt-1.5">
                  <button
                    onClick={() => onGenerateReviewCode(b.id)}
                    className="flex items-center gap-1 rounded-md bg-[var(--button)] px-2 py-1 text-[10px] font-medium text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text-muted)]"
                  >
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                    Generate Review Code
                  </button>
                </div>
              )}

              {b.status === 'confirmed' && b.reviewSubmitted && (
                <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-emerald-900/20 px-2 py-1">
                  <svg className="size-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[11px] font-medium text-emerald-400">Review Submitted</span>
                </div>
              )}

              <div className="mt-1.5 flex gap-1">
                {(['confirmed', 'pending', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onRequestStatusChange(b.id, s)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium leading-tight transition-colors ${
                      b.status === s
                        ? STATUS_STYLES[s] + ' ring-1 ring-inset ring-current'
                        : 'text-[var(--text-dim)] hover:bg-[var(--button-hover)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-2.5 text-center text-xs text-[var(--text-dim)]">
        {bookingsCount} total &middot; Synced with database
      </div>
    </div>
  );
});

export default RightPanel;
