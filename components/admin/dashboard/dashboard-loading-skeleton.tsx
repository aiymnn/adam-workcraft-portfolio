import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminCardHeaderSkeleton, AdminMetricBarRowSkeleton, AdminStatCardSkeleton } from '@/components/admin/loading/skeleton-primitives';

export function DashboardStatCardSkeleton() {
  return <AdminStatCardSkeleton />;
}

export function DashboardChartCardSkeleton() {
  return (
    <Card>
      <AdminCardHeaderSkeleton titleWidthClass="w-28" />
      <CardContent className="space-y-3">
        <Skeleton className="h-[150px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function DashboardRecentListSkeleton() {
  return (
    <Card>
      <AdminCardHeaderSkeleton titleWidthClass="w-32" actionWidthClass="w-14" />
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`recent-skeleton-${i}`} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-24 bg-[var(--border)]" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardInsightsSkeleton() {
  return (
    <Card>
      <AdminCardHeaderSkeleton titleWidthClass="w-28" />
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`insight-bar-${i}`} className="flex items-center gap-2.5">
            <Skeleton className="h-3 w-8" />
            <div className="flex-1">
              <AdminMetricBarRowSkeleton showTopRow={false} barHeightClass="h-8" />
            </div>
            <Skeleton className="h-3 w-6" />
          </div>
        ))}

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardQuickActionsSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4 md:p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-8 w-[170px] rounded-lg border border-[var(--border)] p-1">
          <Skeleton className="h-full w-full" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <DashboardStatCardSkeleton key={`stat-skeleton-${i}`} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCardSkeleton />
        <DashboardChartCardSkeleton />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardRecentListSkeleton />
        <DashboardInsightsSkeleton />
      </div>

      <DashboardQuickActionsSkeleton />
    </div>
  );
}
