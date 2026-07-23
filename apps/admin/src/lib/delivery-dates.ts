import { toDate } from "./format";
import type { Order } from "@raheja/shared";

// Plain YYYY-MM-DD string keys sidestep timezone-aware Date comparison
// bugs entirely — used to group orders by delivery date and to label
// date pickers on both the Procurement and Packing List pages.
export function dateKey(value: unknown): string | null {
  const date = toDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function formatDateKey(key: string): string {
  const date = new Date(`${key}T00:00:00`);
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// Every distinct upcoming delivery date present in the given orders,
// soonest first.
export function upcomingDeliveryDateKeys(orders: Order[]): string[] {
  const todayKey = new Date().toISOString().slice(0, 10);
  const keys = new Set<string>();
  orders.forEach((o) => {
    const key = dateKey(o.deliveryDate);
    if (key && key >= todayKey) keys.add(key);
  });
  return Array.from(keys).sort();
}
