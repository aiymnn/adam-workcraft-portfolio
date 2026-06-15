import { Input } from '@/components/ui/input';

interface AdminSummaryItem {
  label: string;
  value: string | number;
}

interface AdminSummaryGridProps {
  items: AdminSummaryItem[];
}

export function AdminSummaryGrid({ items }: AdminSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3">
          <p className="text-[11px] text-[var(--text-dim)]">{item.label}</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text)]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

interface AdminFilterOption {
  id: string;
  label: string;
}

interface AdminSearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  filterOptions: AdminFilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  helperText?: string;
}

export function AdminSearchFilterBar({
  query,
  onQueryChange,
  queryPlaceholder,
  filterOptions,
  activeFilter,
  onFilterChange,
  helperText,
}: AdminSearchFilterBarProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-start)] p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-sm">
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={queryPlaceholder}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === option.id
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'bg-[var(--button)] text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {helperText ? (
        <p className="mt-2 text-[11px] text-[var(--text-dim)]">{helperText}</p>
      ) : null}
    </div>
  );
}
