'use client';

import { forwardRef, type ImgHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const initials = fallback
      ? fallback
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <div
        ref={ref}
        className={cn('relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--button)]', className)}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt ?? ''} className="size-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-[var(--text-muted)]">{initials}</span>
        )}
      </div>
    );
  },
);
Avatar.displayName = 'Avatar';

export { Avatar };
