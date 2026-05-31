import { AdminSearchFilterBar, AdminSummaryGrid } from '@/components/admin/shared/admin-insights-ui';

interface GallerySummaryItem {
  label: string;
  value: number;
}

interface GallerySummaryGridProps {
  items: GallerySummaryItem[];
}

export function GallerySummaryGrid({ items }: GallerySummaryGridProps) {
  return <AdminSummaryGrid items={items} />;
}

interface GalleryFilterOption {
  id: string;
  label: string;
}

interface GallerySearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  filterOptions: GalleryFilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  helperText?: string;
}

export function GallerySearchFilterBar({
  query,
  onQueryChange,
  queryPlaceholder,
  filterOptions,
  activeFilter,
  onFilterChange,
  helperText,
}: GallerySearchFilterBarProps) {
  return (
    <AdminSearchFilterBar
      query={query}
      onQueryChange={onQueryChange}
      queryPlaceholder={queryPlaceholder}
      filterOptions={filterOptions}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      helperText={helperText}
    />
  );
}
