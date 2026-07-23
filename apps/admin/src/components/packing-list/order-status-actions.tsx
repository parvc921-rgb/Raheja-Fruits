"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { ORDER_STATUS_TRANSITIONS } from "@raheja/shared";
import type { OrderStatus, OrderMutationResult } from "@raheja/shared";

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  undelivered: "Not delivered",
};

// Undo-style transitions (packed -> placed, out_for_delivery -> packed)
// render as plain text links rather than primary buttons, so the main
// forward action stays visually dominant.
const UNDO_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  packed: "placed",
  out_for_delivery: "packed",
};

export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  const nextOptions = ORDER_STATUS_TRANSITIONS[status];
  const undoTarget = UNDO_TRANSITIONS[status];
  const forwardOptions = nextOptions.filter((s) => s !== undoTarget);

  const handleTransition = async (nextStatus: OrderStatus) => {
    setUpdating(nextStatus);
    try {
      const updateOrderStatus = httpsCallable<
        { orderId: string; status: OrderStatus },
        OrderMutationResult
      >(functions, "updateOrderStatus");
      const { data } = await updateOrderStatus({ orderId, status: nextStatus });
      if (!data.ok) console.error("updateOrderStatus failed", data.error);
    } catch (err) {
      console.error("updateOrderStatus failed", err);
    } finally {
      setUpdating(null);
    }
  };

  if (nextOptions.length === 0) {
    return <p className="text-xs text-muted-foreground">No further action</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forwardOptions.map((next) => (
        <button
          key={next}
          onClick={() => handleTransition(next)}
          disabled={updating !== null}
          className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
            next === "undelivered"
              ? "border border-berry text-berry hover:bg-berry/5"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {updating === next ? "Updating…" : `Mark ${STATUS_LABELS[next]}`}
        </button>
      ))}
      {undoTarget && (
        <button
          onClick={() => handleTransition(undoTarget)}
          disabled={updating !== null}
          className="text-xs text-muted-foreground underline disabled:opacity-50"
        >
          {updating === undoTarget ? "Undoing…" : `Undo to ${STATUS_LABELS[undoTarget]}`}
        </button>
      )}
    </div>
  );
}
