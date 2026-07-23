"use client";

import { useMemo, useState } from "react";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useRecentOrders } from "@/lib/orders";
import { OrdersFilterBar, type OrderFilters } from "@/components/orders/orders-filter-bar";
import { OrdersTable } from "@/components/orders/orders-table";

export default function OrdersDashboardPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "operations", "read_only"]);
  const { orders, loading: ordersLoading } = useRecentOrders();
  const [filters, setFilters] = useState<OrderFilters>({
    buildingId: null,
    wing: null,
    status: null,
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filters.buildingId && order.buildingId !== filters.buildingId) return false;
      if (filters.wing && order.wing !== filters.wing) return false;
      if (filters.status && order.status !== filters.status) return false;
      return true;
    });
  }, [orders, filters]);

  if (loading || !authorized) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Orders</h1>

      <div className="mb-4">
        <OrdersFilterBar filters={filters} onChange={setFilters} />
      </div>

      {ordersLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {filteredOrders.length} of {orders.length} recent orders
          </p>
          <OrdersTable orders={filteredOrders} />
        </>
      )}
    </div>
  );
}
