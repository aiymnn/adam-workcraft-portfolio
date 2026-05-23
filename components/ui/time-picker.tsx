'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function ClockIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TimeColumn({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current.querySelector(`[data-value="${selected}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [selected]);

  return (
    <div
      ref={ref}
      className="flex h-52 flex-col overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]"
    >
      {items.map((v) => (
        <button
          key={v}
          data-value={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`flex h-8 items-center justify-center px-3 text-sm transition-colors duration-150 ${
            v === selected
              ? 'bg-[var(--button-hover)] font-medium text-[var(--text)]'
              : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text)]'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const TimePicker = memo(function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hour, minute] = value.split(':');

  const handleHour = useCallback(
    (h: string) => {
      onChange(`${h}:${minute}`);
    },
    [minute, onChange],
  );

  const handleMinute = useCallback(
    (m: string) => {
      onChange(`${hour}:${m}`);
      setOpen(false);
    },
    [hour, onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-end)]/50 px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[var(--button)] sm:h-9">
        <span>{value || 'Pick a time'}</span>
        <ClockIcon />
      </PopoverTrigger>
      <PopoverContent className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] p-2 shadow-2xl">
        <TimeColumn items={HOURS} selected={hour} onSelect={handleHour} />
        <div className="w-px bg-[var(--border)]" />
        <TimeColumn items={MINUTES} selected={minute} onSelect={handleMinute} />
      </PopoverContent>
    </Popover>
  );
});

export { TimePicker };
