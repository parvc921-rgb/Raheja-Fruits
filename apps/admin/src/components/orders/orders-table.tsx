"use client";

import { useBuildings } from "@/lib/buildings";
import { formatDate } from "@/lib/format";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order } from "@raheja/shared";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const { buildings } = useBuildings();
  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No orders match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Placed</th>
            <th className="px-3 py-2 font-medium">Address</th>
            <th className="px-3 py-2 font-medium">Items</th>
            <th className="px-3 py-2 font-medium">Total</th>
            <th className="px-3 py-2 font-medium">Delivery</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-border align-top">
              <td className="px-3 py-2 text-muted-foreground">{formatDate(order.placedAt)}</td>
              <td className="px-3 py-2">
                {buildingName(order.buildingId)}
                <span className="text-muted-foreground"> · {order.wing}-{order.flatNumber}</span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
              </td>
              <td className="px-3 py-2 font-medium">₹{order.subtotal}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {formatDate(order.deliveryDate)}, {order.deliveryWindow.replace("-", "–")}
              </td>
              <td className="px-3 py-2">
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
