"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useRecentOrders } from "@/lib/orders";
import { useBuildings } from "@/lib/buildings";
import { upcomingDeliveryDateKeys, formatDateKey } from "@/lib/delivery-dates";
import { groupOrdersForPacking } from "@/lib/packing-list";
import { BuildingSection } from "@/components/packing-list/building-section";

export default function PackingListPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "operations", "read_only"]);
  const { admin } = useAuth();
  const { orders, loading: ordersLoading } = useRecentOrders();
  const { buildings } = useBuildings();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dateKeys = useMemo(() => upcomingDeliveryDateKeys(orders), [orders]);

  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  const groups = useMemo(
    () => (selectedDate ? groupOrdersForPacking(orders, selectedDate) : []),
    [orders, selectedDate]
  );

  if (loading || !authorized) return null;

  const canWrite = admin?.role === "super_admin" || admin?.role === "operations";
  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Packing List</h1>

      {ordersLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : dateKeys.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No upcoming deliveries yet.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Delivery date</label>
            <select
              value={selectedDate ?? ""}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-fit rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              {dateKeys.map((key) => (
                <option key={key} value={key}>
                  {formatDateKey(key)}
                </option>
              ))}
            </select>
          </div>

          {groups.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No orders for this delivery date.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <BuildingSection
                  key={group.buildingId}
                  group={group}
                  buildingName={buildingName(group.buildingId)}
                  canWrite={canWrite}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
