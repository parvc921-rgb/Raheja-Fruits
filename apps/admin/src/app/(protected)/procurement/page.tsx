"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useRecentOrders } from "@/lib/orders";
import {
  aggregateProcurement,
  upcomingDeliveryDateKeys,
  formatDateKey,
} from "@/lib/procurement";
import { exportProcurementToExcel } from "@/lib/excel-export";
import { ProcurementTable } from "@/components/procurement/procurement-table";

export default function ProcurementPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "procurement", "read_only"]);
  const { orders, loading: ordersLoading } = useRecentOrders();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const dateKeys = useMemo(() => upcomingDeliveryDateKeys(orders), [orders]);

  // Default to the soonest upcoming delivery date once orders load.
  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  const rows = useMemo(
    () => (selectedDate ? aggregateProcurement(orders, selectedDate) : []),
    [orders, selectedDate]
  );

  if (loading || !authorized) return null;

  const handleExport = async () => {
    if (!selectedDate || rows.length === 0) return;
    setExporting(true);
    try {
      await exportProcurementToExcel(rows, selectedDate);
    } catch (err) {
      console.error("Excel export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Procurement Report</h1>

      {ordersLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : dateKeys.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No upcoming deliveries yet.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Delivery date
              </label>
              <select
                value={selectedDate ?? ""}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                {dateKeys.map((key) => (
                  <option key={key} value={key}>
                    {formatDateKey(key)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export to Excel"}
            </button>
          </div>

          <ProcurementTable rows={rows} />
        </>
      )}
    </div>
  );
}
