import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusActions } from "./order-status-actions";
import type { Order } from "@raheja/shared";

export function PackingOrderCard({ order, canWrite }: { order: Order; canWrite: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-base font-semibold">Flat {order.flatNumber}</p>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.fruitId} className="flex items-center gap-2 text-sm">
            <span
              className="h-4 w-4 shrink-0 rounded border border-border"
              aria-hidden="true"
            />
            <span>
              {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
          </li>
        ))}
      </ul>

      {canWrite && (
        <div className="mt-3 border-t border-border pt-3">
          <OrderStatusActions orderId={order.id} status={order.status} />
        </div>
      )}
    </div>
  );
}
