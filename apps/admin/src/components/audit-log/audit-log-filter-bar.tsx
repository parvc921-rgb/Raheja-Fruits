"use client";

import { useAdmins } from "@/lib/admins";
import { formatAction } from "@/lib/audit-summary";
import type { AuditLogEntry } from "@raheja/shared";

export interface AuditLogFilters {
  actorId: string | null;
  action: string | null;
  targetType: AuditLogEntry["targetType"] | null;
  fromDate: string | null; // YYYY-MM-DD
  toDate: string | null; // YYYY-MM-DD
}

const TARGET_TYPES: AuditLogEntry["targetType"][] = ["fruit", "customer", "order", "building", "settings"];

export function AuditLogFilterBar({
  filters,
  onChange,
  availableActions,
}: {
  filters: AuditLogFilters;
  onChange: (filters: AuditLogFilters) => void;
  availableActions: string[];
}) {
  const { admins } = useAdmins();

  const hasActiveFilters =
    filters.actorId || filters.action || filters.targetType || filters.fromDate || filters.toDate;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Actor</label>
        <select
          value={filters.actorId ?? ""}
          onChange={(e) => onChange({ ...filters, actorId: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All admins</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Action</label>
        <select
          value={filters.action ?? ""}
          onChange={(e) => onChange({ ...filters, action: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All actions</option>
          {availableActions.map((a) => (
            <option key={a} value={a}>
              {formatAction(a)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Target</label>
        <select
          value={filters.targetType ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              targetType: (e.target.value || null) as AuditLogFilters["targetType"],
            })
          }
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <input
          type="date"
          value={filters.fromDate ?? ""}
          onChange={(e) => onChange({ ...filters, fromDate: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <input
          type="date"
          value={filters.toDate ?? ""}
          onChange={(e) => onChange({ ...filters, toDate: e.target.value || null })}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={() =>
            onChange({ actorId: null, action: null, targetType: null, fromDate: null, toDate: null })
          }
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
