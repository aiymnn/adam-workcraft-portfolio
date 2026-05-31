import { Skeleton } from '@/components/ui/skeleton';

function GallerySummarySkeleton({ count }: { count: number }) {
  const titleWidths = ['w-20', 'w-24', 'w-28', 'w-22'];
  const valueWidths = ['w-12', 'w-16', 'w-14', 'w-10'];

  return (
    <div className={`grid gap-3 md:gap-4 ${count === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`gallery-summary-skeleton-${count}-${index}`}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4"
        >
          <Skeleton className={`h-3 ${titleWidths[index % titleWidths.length]}`} />
          <Skeleton className={`mt-3 h-7 ${valueWidths[index % valueWidths.length]}`} />
        </div>
      ))}
    </div>
  );
}

function GalleryFilterBarSkeleton({ chipCount }: { chipCount: number }) {
  const chipWidths = ['w-16', 'w-20', 'w-24', 'w-18', 'w-14'];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-10 w-full rounded-lg lg:max-w-sm" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: chipCount }, (_, index) => (
            <Skeleton
              key={`gallery-filter-chip-${chipCount}-${index}`}
              className={`h-8 rounded-full ${chipWidths[index % chipWidths.length]}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VaultInfoBannerSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3 md:gap-3">
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
  );
}

function VaultRowSkeleton() {
  const desktopWidths = ['w-32', 'w-24', 'w-28', 'w-20', 'w-36'];
  const mobileMetaWidths = ['w-48', 'w-56', 'w-44', 'w-52', 'w-40'];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4">
      <div className="hidden items-center gap-3 md:flex">
        <Skeleton className="h-4 w-5" />
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className={`h-4 ${desktopWidths[0]} min-w-0 flex-1`} />
        <Skeleton className={`h-9 ${desktopWidths[1]} rounded-lg`} />
        <Skeleton className={`h-9 ${desktopWidths[2]} rounded-lg`} />
        <Skeleton className={`h-9 ${desktopWidths[3]} rounded-lg`} />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-5" />
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className={`h-4 ${desktopWidths[4]} max-w-full flex-1`} />
        </div>
        <Skeleton className={`mt-3 h-4 ${mobileMetaWidths[0]} max-w-full`} />
        <div className="mt-3 flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function VaultLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <VaultInfoBannerSkeleton />
      <GallerySummarySkeleton count={3} />
      <GalleryFilterBarSkeleton chipCount={4} />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <VaultRowSkeleton key={`vault-row-skeleton-${i}`} />
        ))}
      </div>
    </div>
  );
}

function ReviewTableSkeleton() {
  const authorWidths = ['w-24', 'w-20', 'w-28', 'w-16', 'w-22', 'w-26'];
  const roleWidths = ['w-20', 'w-16', 'w-24', 'w-14', 'w-18', 'w-12'];
  const quoteWidths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-full', 'w-8/12'];

  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
      <div className="grid grid-cols-12 gap-3 border-b border-[var(--border)] bg-[var(--bg-start)] px-4 py-3">
        <Skeleton className="col-span-3 h-3 w-16" />
        <Skeleton className="col-span-4 h-3 w-16" />
        <Skeleton className="col-span-3 h-3 w-20" />
        <Skeleton className="col-span-2 h-3 w-14" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`review-table-row-${i}`} className="grid grid-cols-12 items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
            <div className="col-span-3 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className={`h-4 ${authorWidths[i % authorWidths.length]}`} />
                <Skeleton className={`h-3 ${roleWidths[i % roleWidths.length]}`} />
              </div>
            </div>
            <div className="col-span-4">
              <Skeleton className={`h-4 ${quoteWidths[i % quoteWidths.length]}`} />
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
  const authorWidths = ['w-28', 'w-24', 'w-32', 'w-20'];
  const roleWidths = ['w-24', 'w-18', 'w-20', 'w-16'];
  const quoteWidths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12'];

  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`review-mobile-card-${i}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="space-y-2">
              <Skeleton className={`h-4 ${authorWidths[i % authorWidths.length]}`} />
              <Skeleton className={`h-3 ${roleWidths[i % roleWidths.length]}`} />
            </div>
          </div>
          <Skeleton className={`mb-3 h-4 ${quoteWidths[i % quoteWidths.length]}`} />
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
    <div className="space-y-4">
      <GallerySummarySkeleton count={4} />
      <GalleryFilterBarSkeleton chipCount={4} />
      <ReviewTableSkeleton />
      <ReviewMobileCardSkeleton />
    </div>
  );
}
