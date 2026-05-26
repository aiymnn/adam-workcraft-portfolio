'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, AlertIcon, XIcon } from '@/components/shared/icons';
import type { Toast } from '@/hooks/use-toast';

const variantContainer: Record<string, string> = {
  success: 'bg-emerald-900/10 border-emerald-500/30',
  error: 'bg-red-900/10 border-red-500/30',
  warning: 'bg-amber-900/10 border-amber-500/30',
  info: 'bg-[var(--bg-mid)] border-[var(--border)]',
};

const variantIconColor: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-[var(--text)]',
};

const variantIcons: Record<string, typeof CheckIcon> = {
  success: CheckIcon,
  error: AlertIcon,
  warning: AlertIcon,
  info: CheckIcon,
};

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const Icon = useMemo(() => variantIcons[toast.variant] || CheckIcon, [toast.variant]);

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 pr-10 shadow-lg animate-toast-in',
        variantContainer[toast.variant],
        '[&.toast-out]:animate-toast-out',
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', variantIconColor[toast.variant])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
