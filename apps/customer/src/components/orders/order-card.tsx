"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@raheja/shared";
import { StatusBadge } from "./status-badge";
import { formatOrderDate, formatDeliveryDate } from "@/lib/format";
import { buildReorder } from "@/lib/reorder";
import { useCartStore } from "@/store/cart-store";

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [reordering, setReordering] = useState(false);
  const [skippedItems, setSkippedItems] = useState<string[] | null>(null);

  const handleReorder = async () => {
    setReordering(true);
    setSkippedItems(null);

    try {
      const { lines, quantities, skipped } = await buildReorder(order);

      lines.forEach((line) =>
        addItem(line, quantities[line.fruitId])
      );

      if (skipped.length > 0) {
        setSkippedItems(skipped);
      }

      if (lines.length > 0) {
        router.push("/cart");
      }
    } catch (err) {
      console.error("Reorder failed", err);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">

      <div className="flex items-start justify-between gap-2">

        <div>

          <p className="text-xs font-semibold text-primary">
            Order No: {order.orderNumber ?? order.id}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Placed {formatOrderDate(order.placedAt)}
          </p>

          <p className="text-sm">
            Delivery {formatDeliveryDate(order.deliveryDate)},{" "}
            {order.deliveryWindow.replace("-", "–")}
          </p>

        </div>

        <StatusBadge status={order.status} />

      </div>

      <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">

        {order.items.map((item) => (
          <div
            key={item.fruitId}
            className="flex justify-between text-sm"
          >
            <span className="text-muted-foreground">
              {item.name} × {item.quantity}
            </span>

            <span>₹{item.lineTotal}</span>
          </div>
        ))}

      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">

        <span className="font-display text-base font-semibold">
          ₹{order.subtotal}
        </span>

        <button
          onClick={handleReorder}
          disabled={reordering}
          className="rounded-md border border-primary px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          {reordering ? "Adding…" : "Reorder"}
        </button>

      </div>

      {skippedItems && skippedItems.length > 0 && (
        <p className="mt-2 text-xs text-berry">
          {skippedItems.join(", ")}{" "}
          {skippedItems.length === 1 ? "is" : "are"} no longer available and{" "}
          {skippedItems.length === 1 ? "wasn't" : "weren't"} added.
        </p>
      )}

    </div>
  );
}