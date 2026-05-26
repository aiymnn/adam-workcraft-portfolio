'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

const MAX_TOASTS = 5;
const DISMISS_DURATION = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
};

function genId() {
  return (++genId._count).toString(36);
}
genId._count = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = genId();
      const toast: Toast = { id, variant, title, description };
      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      const duration = DISMISS_DURATION[variant];
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = {
    success: useCallback((title: string, description?: string) => addToast('success', title, description), [addToast]),
    error: useCallback((title: string, description?: string) => addToast('error', title, description), [addToast]),
    warning: useCallback((title: string, description?: string) => addToast('warning', title, description), [addToast]),
    info: useCallback((title: string, description?: string) => addToast('info', title, description), [addToast]),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
