"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerOrders } from "@/lib/orders";
import { OrderCard } from "@/components/orders/order-card";

export default function OrdersPage() {
  const { loading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useCustomerOrders(user);
  const searchParams = useSearchParams();
  const placedOrderId = searchParams.get("placed");

  if (authLoading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Order History</h1>
        <Link href="/catalogue" className="text-sm text-muted-foreground underline">
          Browse fruits
        </Link>
      </div>

      {placedOrderId && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-display text-base font-semibold text-primary">Order placed!</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll deliver it tomorrow between 6:00–7:00 AM. A WhatsApp confirmation is on its way.
          </p>
        </div>
      )}

      {ordersLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-border p-4">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-display text-lg font-medium">No orders yet</p>
      <p className="text-sm text-muted-foreground">
        Your past orders will show up here once you place one.
      </p>
      <Link
        href="/catalogue"
        className="mt-3 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Browse fruits
      </Link>
    </div>
  );
}
