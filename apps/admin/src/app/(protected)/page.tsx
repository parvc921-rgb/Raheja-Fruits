"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRecentOrders, ACTIVE_STATUSES } from "@/lib/orders";
import { toDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus } from "@raheja/shared";

const ALL_STATUSES: OrderStatus[] = [
  "placed",
  "packed",
  "out_for_delivery",
  "delivered",
  "undelivered",
];

function isToday(value: unknown): boolean {
  const date = toDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// All roles can view the dashboard — no role restriction beyond the
// base "signed in and active" check the (protected) layout already does.
export default function DashboardPage() {
  const { orders, loading } = useRecentOrders();

  const stats = useMemo(() => {
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const activeRevenue = active.reduce((sum, o) => sum + o.subtotal, 0);

    const placedToday = orders.filter((o) => isToday(o.placedAt));
    const todaysRevenue = placedToday.reduce((sum, o) => sum + o.subtotal, 0);

    const breakdown: Record<OrderStatus, number> = {
      placed: 0,
      packed: 0,
      out_for_delivery: 0,
      delivered: 0,
      undelivered: 0,
    };
    orders.forEach((o) => {
      breakdown[o.status] += 1;
    });

    return { active, activeRevenue, placedToday, todaysRevenue, breakdown };
  }, [orders]);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Dashboard</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Orders in the pipeline"
              value={String(stats.active.length)}
              sublabel="Placed, packed, or out for delivery"
            />
            <StatCard
              label="Value in the pipeline"
              value={`₹${stats.activeRevenue}`}
            />
            <StatCard
              label="Orders placed today"
              value={String(stats.placedToday.length)}
            />
            <StatCard
              label="Revenue today"
              value={`₹${stats.todaysRevenue}`}
            />
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">Status breakdown</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <OrderStatusBadge status={status} />
                  <span className="text-sm font-medium">{stats.breakdown[status]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickLink href="/orders" label="View all orders" />
            <QuickLink href="/procurement" label="Procurement report" />
            <QuickLink href="/packing-list" label="Packing list" />
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-card p-4 text-sm font-medium hover:border-primary/50 hover:bg-primary/5"
    >
      {label} →
    </Link>
  );
}
