'use client';

import { useState, memo, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDownIcon } from '@/components/shared/icons';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Select = memo(function Select({ value, options, onChange, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--button-hover)]',
            !selected && 'text-[var(--text-dim)]',
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder || 'Select...'}</span>
          <ChevronDownIcon className="size-3 shrink-0 text-[var(--text-dim)]" />
        </PopoverTrigger>
        <PopoverContent className="z-50 min-w-[var(--radix-popover-trigger-width)] rounded-xl border border-[var(--border)] bg-[var(--bg-mid)] p-1.5 shadow-2xl">
          <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors md:py-2',
                  opt.value === value
                    ? 'bg-[var(--button-hover)] font-medium text-[var(--text)]'
                    : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
    </Popover>
  );
});

export { Select };
