import { Skeleton } from '@/components/ui/skeleton';

function VaultInfoBannerSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 md:gap-3">
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  );
}

function VaultRowSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4">
      <div className="hidden items-center gap-3 md:flex">
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-4 w-5" />
        </div>
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-4 w-5" />
          </div>
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-3 h-4 w-52" />
        <div className="mt-3 flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function VaultLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <VaultInfoBannerSkeleton />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <VaultRowSkeleton key={`vault-row-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

function ReviewTableSkeleton() {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
      <div className="border-b border-[var(--border)] bg-[var(--bg-start)] px-4 py-3">
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`review-table-row-${i}`} className="grid grid-cols-12 items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
            <div className="col-span-3 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="col-span-4">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="col-span-3 flex items-center gap-1.5">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
            <div className="col-span-2 flex gap-1">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewMobileCardSkeleton() {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`review-mobile-card-${i}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="mb-3 h-4 w-full" />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewCollectionLoadingSkeleton() {
  return (
    <>
      <ReviewTableSkeleton />
      <ReviewMobileCardSkeleton />
    </>
  );
}
