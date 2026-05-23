'use client';

import { useState, useRef, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

function usePopover() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover components must be used within a Popover');
  return ctx;
}

export function Popover({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: { children: ReactNode; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const ref = useRef<HTMLDivElement>(null);

  const setOpen = useCallback((v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, setOpen]);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, className, asChild }: { children: ReactNode; className?: string; asChild?: boolean }) {
  const { open, setOpen } = usePopover();
  if (asChild) {
    return <div onClick={() => setOpen(!open)} className={cn('cursor-pointer', className)}>{children}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn('inline-flex items-center justify-center', className)}
    >
      {children}
    </button>
  );
}

export function PopoverContent({ children, className, align = 'start' }: { children: ReactNode; className?: string; align?: 'start' | 'end' | 'center' }) {
  const { open } = usePopover();
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute top-full z-50 mt-1 animate-popover-in',
        align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
