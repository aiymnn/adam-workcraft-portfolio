'use client';

import { memo } from 'react';
import type { Booking } from './types';
import { STATUS_STYLES, STATUS_LABELS } from './types';
import { Button } from '@/components/ui/button';

function PlusIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

interface RightPanelProps {
  selectedDate: Date;
  dateLabel: string;
  isToday: boolean;
  dayBookings: Booking[];
  bookingsCount: number;
  changingStatusId: string | null;
  onNewBooking: () => void;
  onEditBooking: (b: Booking) => void;
  onStatusChange: (id: string, status: Booking['status']) => void;
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
  onStatusChange,
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

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
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
                  className="shrink-0 rounded-md p-1 text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-dim)]">
                <span>{b.service}</span>
                <span>{b.email}</span>
              </div>
              <div className="mt-1.5 flex gap-1">
                {(['confirmed', 'pending', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(b.id, s)}
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
        {bookingsCount} total &middot; Saved locally
      </div>
    </div>
  );
});

export default RightPanel;
