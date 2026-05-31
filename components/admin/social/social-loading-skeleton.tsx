import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStatCardSkeleton } from '@/components/admin/loading/skeleton-primitives';

export function SocialLinksLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={`social-link-skeleton-${i}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-3 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlatformChartSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-0">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={`platform-chart-label-${i}`} className="h-3 flex-1" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformBarsSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-4">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-0">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`platform-bar-row-${i}`} className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-4 flex-1 rounded-full" />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlatformTopListSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-4">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 pt-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`platform-top-item-${i}`} className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PlatformDashboardLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AdminStatCardSkeleton key={`platform-stat-skeleton-${i}`} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <PlatformChartSkeleton />

      <div className="grid gap-4 lg:grid-cols-2">
        <PlatformBarsSkeleton />
        <PlatformTopListSkeleton />
      </div>
    </div>
  );
}
