import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminCardHeaderSkeleton, AdminMetricBarRowSkeleton, AdminStatCardSkeleton, AdminTableRowSkeleton } from '@/components/admin/loading/skeleton-primitives';

export function StatisticsVisitLogSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }, (_, i) => (
        <AdminTableRowSkeleton key={`statistics-list-skeleton-${i}`} columns={['col-span-2', 'col-span-3', 'col-span-2', 'col-span-2', 'col-span-3']} />
      ))}
    </div>
  );
}

function StatisticsTopBucketsSkeleton() {
  return (
    <Card>
      <AdminCardHeaderSkeleton titleWidthClass="w-24" />
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <AdminMetricBarRowSkeleton key={`bucket-skeleton-${i}`} labelWidthClass="w-28" valueWidthClass="w-8" barHeightClass="h-1.5" />
        ))}
      </CardContent>
    </Card>
  );
}

export function StatisticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AdminStatCardSkeleton key={`statistics-stat-skeleton-${i}`} />
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px_200px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatisticsTopBucketsSkeleton />
        <StatisticsTopBucketsSkeleton />
        <StatisticsTopBucketsSkeleton />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-20 bg-[var(--border)]" />
        </CardHeader>
        <CardContent className="space-y-3">
          <StatisticsVisitLogSkeleton />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Skeleton className="h-4 w-52" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
