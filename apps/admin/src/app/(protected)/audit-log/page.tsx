"use client";

import { useMemo, useState } from "react";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useAuditLog } from "@/lib/audit-log";
import { toDate } from "@/lib/format";
import {
  AuditLogFilterBar,
  type AuditLogFilters,
} from "@/components/audit-log/audit-log-filter-bar";
import { AuditLogTable } from "@/components/audit-log/audit-log-table";

const EMPTY_FILTERS: AuditLogFilters = {
  actorId: null,
  action: null,
  targetType: null,
  fromDate: null,
  toDate: null,
};

export default function AuditLogPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "read_only"]);
  const { entries, loading: entriesLoading } = useAuditLog();
  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_FILTERS);

  const availableActions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))).sort(),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.actorId && entry.actorId !== filters.actorId) return false;
      if (filters.action && entry.action !== filters.action) return false;
      if (filters.targetType && entry.targetType !== filters.targetType) return false;

      const entryDate = toDate(entry.timestamp);
      if (filters.fromDate && entryDate) {
        if (entryDate < new Date(`${filters.fromDate}T00:00:00`)) return false;
      }
      if (filters.toDate && entryDate) {
        if (entryDate > new Date(`${filters.toDate}T23:59:59`)) return false;
      }

      return true;
    });
  }, [entries, filters]);

  if (loading || !authorized) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Audit Log</h1>

      <div className="mb-4">
        <AuditLogFilterBar
          filters={filters}
          onChange={setFilters}
          availableActions={availableActions}
        />
      </div>

      {entriesLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {filteredEntries.length} of {entries.length} recent entries
          </p>
          <AuditLogTable entries={filteredEntries} />
        </>
      )}
    </div>
  );
}
