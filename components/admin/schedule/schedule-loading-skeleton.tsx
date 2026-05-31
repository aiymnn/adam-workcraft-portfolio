import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStatCardSkeleton } from '@/components/admin/loading/skeleton-primitives';

interface ScheduleLoadingSkeletonProps {
  mobileTab: 'calendar' | 'bookings';
}

function ScheduleCalendarSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]/30">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-8 rounded-lg" />
      </div>

      <div className="grid grid-cols-7 border-b border-[var(--border)] px-1 py-2">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={`schedule-day-label-${i}`} className="flex justify-center px-1">
            <Skeleton className="h-3 w-7" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-[var(--border)] p-px">
        {Array.from({ length: 35 }, (_, i) => (
          <div key={`schedule-grid-cell-${i}`} className="min-h-[90px] bg-[var(--bg-mid)] px-1.5 py-2">
            <Skeleton className="mb-2 h-5 w-5 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleRightPanelSkeleton() {
  return (
    <Card className="h-full rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      <CardContent className="space-y-2 p-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={`schedule-list-item-${i}`} className="rounded-lg border border-[var(--border)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-11/12" />
              </div>
              <Skeleton className="size-7 rounded-md" />
            </div>
            <div className="mt-2 flex gap-1">
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          </div>
        ))}
      </CardContent>

      <div className="border-t border-[var(--border)] px-4 py-2.5">
        <Skeleton className="mx-auto h-3 w-40" />
      </div>
    </Card>
  );
}

export function ScheduleLoadingSkeleton({ mobileTab }: ScheduleLoadingSkeletonProps) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <AdminStatCardSkeleton key={`schedule-stat-skeleton-${i}`} />
        ))}
      </div>

      <div className="mb-4 flex rounded-lg border border-[var(--border)] p-0.5 lg:hidden">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={`schedule-mobile-tab-skeleton-${i}`} className="h-8 flex-1 rounded-md" />
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className={`lg:w-8/12 ${mobileTab !== 'calendar' ? 'hidden lg:block' : ''}`}>
          <ScheduleCalendarSkeleton />
        </section>

        <section className={`lg:w-4/12 ${mobileTab !== 'bookings' ? 'hidden lg:block' : ''}`}>
          <ScheduleRightPanelSkeleton />
        </section>
      </div>
    </>
  );
}
