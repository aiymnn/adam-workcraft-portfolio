'use client';

import { useState, memo } from 'react';
import type { Booking, FormData } from './types';
import { SERVICES, STATUS_STYLES } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { XIcon } from '@/components/shared/icons';
import { format, parse } from 'date-fns';

function CalendarIconSm() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

interface ScheduleDialogProps {
  open: boolean;
  editingBooking: Booking | null;
  formData: FormData;
  onFormChange: (field: keyof FormData, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const ScheduleDialog = memo(function ScheduleDialog({
  open,
  editingBooking,
  formData,
  onFormChange,
  onSave,
  onClose,
  onDelete,
}: ScheduleDialogProps) {
  const [dateOpen, setDateOpen] = useState(false);

  if (!open) return null;

  return (
    <div
      className="scrollbar-hidden fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl sm:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4 shrink-0">
          <h3 className="text-sm font-semibold">
            {editingBooking ? 'Edit Booking' : 'New Booking'}
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] transition-colors hover:bg-[var(--button-hover)] sm:size-7"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-hidden flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:overflow-y-visible sm:px-5 sm:py-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">Date</label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-end)]/50 px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--button)] sm:h-9">
                <span className={formData.date ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}>
                  {formData.date
                    ? format(parse(formData.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')
                    : 'Pick a date'}
                </span>
                <CalendarIconSm />
              </PopoverTrigger>
              <PopoverContent className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] shadow-2xl">
                <Calendar
                  mode="single"
                  selected={
                    formData.date
                      ? parse(formData.date, 'yyyy-MM-dd', new Date())
                      : undefined
                  }
                  onSelect={(d) => {
                    if (d) {
                      onFormChange('date', format(d, 'yyyy-MM-dd'));
                      setDateOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">Time</label>
            <TimePicker
              value={formData.time}
              onChange={(v) => onFormChange('time', v)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              placeholder="John Doe"
              className="h-10 sm:h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Email <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange('email', e.target.value)}
              placeholder="john@example.com"
              className="h-10 sm:h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">Phone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange('phone', e.target.value)}
              placeholder="+60 12-345 6789"
              className="h-10 sm:h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">Service</label>
            <div className="flex flex-wrap gap-1.5">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFormChange('service', s)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    formData.service === s
                      ? 'border-[var(--button-hover)] bg-[var(--button-hover)] text-[var(--text)]'
                      : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--button-hover)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {editingBooking && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Status</label>
              <div className="flex gap-2">
                {(['pending', 'confirmed', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onFormChange('status', s)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      (formData.status || editingBooking.status) === s
                        ? STATUS_STYLES[s] + ' ring-1 ring-inset ring-current'
                        : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--button-hover)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)]">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              placeholder="Any special requests or details..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-end)]/50 px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--button-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--button-hover)]"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4">
          {editingBooking ? (
            <button
              onClick={() => onDelete(editingBooking.id)}
              className="text-xs text-red-400 transition-colors hover:text-red-300"
            >
              Delete booking
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[var(--text-dim)]"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onSave}
              disabled={!formData.name.trim() || !formData.email.trim()}
              className="border border-[var(--border)] bg-[var(--text)] text-[var(--bg-end)] hover:bg-[var(--text-muted)] disabled:opacity-40"
            >
              {editingBooking ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScheduleDialog;
