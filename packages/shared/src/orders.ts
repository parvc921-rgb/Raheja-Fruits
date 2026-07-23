import type { OrderStatus } from "./types";

// Which transitions are legal from a given status. Forward transitions
// are the normal delivery-day flow; a couple of one-step undos are
// allowed for admin convenience (e.g. someone fat-fingers "Packed"), but
// "delivered" is terminal — there's no undo once a delivery is
// confirmed, and "undelivered" can only be retried by sending it back
// out, not skipped straight to delivered.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["packed"],
  packed: ["out_for_delivery", "placed"],
  out_for_delivery: ["delivered", "undelivered", "packed"],
  delivered: [],
  undelivered: ["out_for_delivery"],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}
