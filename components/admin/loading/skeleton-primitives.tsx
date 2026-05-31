import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminStatCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-[var(--border)]" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminCardHeaderSkeletonProps {
  titleWidthClass?: string;
  actionWidthClass?: string;
}

export function AdminCardHeaderSkeleton({
  titleWidthClass = 'w-28',
  actionWidthClass,
}: AdminCardHeaderSkeletonProps) {
  return (
    <CardHeader className={actionWidthClass ? 'flex flex-row items-center justify-between' : undefined}>
      <Skeleton className={`h-4 ${titleWidthClass} bg-[var(--border)]`} />
      {actionWidthClass ? <Skeleton className={`h-3 ${actionWidthClass}`} /> : null}
    </CardHeader>
  );
}

interface AdminMetricBarRowSkeletonProps {
  labelWidthClass?: string;
  valueWidthClass?: string;
  barHeightClass?: string;
  showTopRow?: boolean;
}

export function AdminMetricBarRowSkeleton({
  labelWidthClass = 'w-28',
  valueWidthClass = 'w-8',
  barHeightClass = 'h-1.5',
  showTopRow = true,
}: AdminMetricBarRowSkeletonProps) {
  return (
    <div className="space-y-2">
      {showTopRow ? (
        <div className="flex items-center justify-between gap-2">
          <Skeleton className={`h-3 ${labelWidthClass}`} />
          <Skeleton className={`h-3 ${valueWidthClass}`} />
        </div>
      ) : null}
      <Skeleton className={`${barHeightClass} w-full rounded-full`} />
    </div>
  );
}

interface AdminTableRowSkeletonProps {
  columns: string[];
}

export function AdminTableRowSkeleton({ columns }: AdminTableRowSkeletonProps) {
  return (
    <div className="grid grid-cols-12 gap-3 rounded-lg border border-[var(--border)] p-3">
      {columns.map((className, index) => (
        <Skeleton key={`table-col-${index}`} className={`${className} h-4`} />
      ))}
    </div>
  );
}
