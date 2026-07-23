"use client";

export type FruitStatusFilter = "all" | "available" | "out_of_stock";

export interface FruitFilters {
  search: string;
  category: string | null;
  status: FruitStatusFilter;
}

export const DEFAULT_FRUIT_FILTERS: FruitFilters = {
  search: "",
  category: null,
  status: "all",
};

interface FruitsFilterBarProps {
  filters: FruitFilters;
  onChange: (filters: FruitFilters) => void;
  categories: string[];
}

// Reusable across any fruits list view — takes the current catalogue's
// distinct categories as a prop rather than fetching them itself, so it
// stays a plain, storage-agnostic UI component.
export function FruitsFilterBar({ filters, onChange, categories }: FruitsFilterBarProps) {
  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.category !== null || filters.status !== "all";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-[220px] flex-1 flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by fruit name…"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <select
          value={filters.category ?? ""}
          onChange={(e) => onChange({ ...filters, category: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as FruitStatusFilter })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="available">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => onChange(DEFAULT_FRUIT_FILTERS)}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
