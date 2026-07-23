"use client";

import { useBuildings } from "@/lib/buildings";
import type { OrderStatus } from "@raheja/shared";

export interface OrderFilters {
  buildingId: string | null;
  wing: string | null;
  status: OrderStatus | null;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "placed", label: "Placed" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "undelivered", label: "Not delivered" },
];

export function OrdersFilterBar({
  filters,
  onChange,
}: {
  filters: OrderFilters;
  onChange: (filters: OrderFilters) => void;
}) {
  const { buildings } = useBuildings();
  const selectedBuilding = buildings.find((b) => b.id === filters.buildingId);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Building</label>
        <select
          value={filters.buildingId ?? ""}
          onChange={(e) =>
            onChange({ ...filters, buildingId: e.target.value || null, wing: null })
          }
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Wing</label>
        <select
          value={filters.wing ?? ""}
          onChange={(e) => onChange({ ...filters, wing: e.target.value || null })}
          disabled={!selectedBuilding}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <option value="">All wings</option>
          {selectedBuilding?.wings.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({ ...filters, status: (e.target.value || null) as OrderStatus | null })
          }
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {(filters.buildingId || filters.status) && (
        <button
          onClick={() => onChange({ buildingId: null, wing: null, status: null })}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
