import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const AdminPageShell = forwardRef<HTMLDivElement, AdminPageShellProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-6 px-4 py-6 md:px-6 md:py-8', className)}
      {...props}
    >
      {children}
    </div>
  ),
);
AdminPageShell.displayName = 'AdminPageShell';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
        {description && (
          <p className="text-sm text-[var(--text-dim)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
