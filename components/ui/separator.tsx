import { cn } from '@/lib/utils';

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shrink-0 bg-[var(--border)]', className)}
      role="separator"
      aria-orientation={props['aria-orientation'] ?? 'horizontal'}
      {...props}
    />
  );
}

export { Separator };
