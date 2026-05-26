'use client';

import { useToast } from '@/hooks/use-toast';
import { ToastItem } from '@/components/ui/toast';

export function Toaster() {
  const { toasts, toast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 z-[100] flex flex-col gap-2 pointer-events-none left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={toast.dismiss} />
        </div>
      ))}
    </div>
  );
}
