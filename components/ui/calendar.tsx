'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

const defaultClassNames: Partial<Record<string, string>> = {
  root: 'p-4',
  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
  month: 'space-y-4',
  month_caption: 'flex justify-center pt-1 relative items-center',
  caption_label: 'text-sm font-medium text-[var(--text)]',
  nav: 'space-x-1 flex items-center',
  button_previous: 'absolute left-1 transition-colors duration-150',
  button_next: 'absolute right-1 transition-colors duration-150',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-10 text-xs text-[var(--text-dim)] font-normal',
  week: 'flex w-full mt-2',
  day: 'p-0 text-center text-sm',
  day_button:
    'size-10 p-0 font-normal rounded-lg transition-colors duration-150 hover:bg-[var(--button)] hover:text-[var(--text)]',
  today: 'font-semibold border border-[var(--border)] rounded-lg transition-colors duration-150',
  outside: 'opacity-40',
  disabled: 'opacity-30 cursor-not-allowed',
  selected: 'bg-[var(--button-hover)] text-[var(--text)] rounded-lg transition-colors duration-150',
};

export function Calendar({ className, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn('w-fit', className)}
      classNames={defaultClassNames}
      components={{
        Chevron: ({ orientation, size = 16 }) => {
          let d: string;
          switch (orientation) {
            case 'left':
              d = 'M15 18l-6-6 6-6';
              break;
            case 'right':
              d = 'M9 18l6-6-6-6';
              break;
            case 'up':
              d = 'M18 15l-6-6-6 6';
              break;
            default:
              d = 'M6 9l6 6 6-6';
          }
          return (
            <svg
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={d} />
            </svg>
          );
        },
      }}
      {...props}
    />
  );
}
