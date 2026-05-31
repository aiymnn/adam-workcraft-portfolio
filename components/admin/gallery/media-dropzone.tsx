'use client';

import { memo, useState } from 'react';

interface MediaDropzoneProps {
  title: string;
  hint: string;
  icon: 'image' | 'video';
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  className?: string;
}

export const MediaDropzone = memo(function MediaDropzone({ title, hint, icon, onDrop, onClick, className = '' }: MediaDropzoneProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      aria-label={title}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isActive) setIsActive(true);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsActive(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsActive(false);
      }}
      onDrop={(event) => {
        setIsActive(false);
        onDrop(event);
      }}
      className={`rounded-xl border border-dashed px-4 py-4 text-xs transition-all ${
        isActive
          ? 'border-amber-500/80 bg-amber-900/20 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]'
          : 'border-[var(--border)] bg-[var(--bg-start)] text-[var(--text-dim)] hover:border-amber-700/40 hover:bg-[var(--bg-mid)]'
      } ${onClick ? 'cursor-pointer select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50' : ''} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border sm:size-9 ${
          isActive
            ? 'border-amber-400/60 bg-amber-400/15 text-amber-200'
            : 'border-[var(--border)] bg-[var(--button)] text-[var(--text-dim)]'
        }`}>
          {icon === 'image' ? (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          ) : (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text)]">{title}</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-dim)]">{hint}</p>
        </div>
      </div>
    </div>
  );
});