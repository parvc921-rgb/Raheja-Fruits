import { dateKey } from "./delivery-dates";
import type { Order } from "@raheja/shared";

export interface ProcurementRow {
  fruitId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  orderCount: number;
}

// Re-exported for convenience so existing imports of dateKey/
// formatDateKey/upcomingDeliveryDateKeys from "@/lib/procurement" keep
// working — the actual implementations now live in delivery-dates.ts,
// shared with the Packing List page.
export { dateKey, formatDateKey, upcomingDeliveryDateKeys } from "./delivery-dates";

// Sums quantity per fruit across every order whose deliveryDate matches
// the given key. Matches architecture doc §7.6: "aggregate placed
// orders for the next deliveryDate, sum quantity per fruitId."
export function aggregateProcurement(orders: Order[], targetDateKey: string): ProcurementRow[] {
  const rows = new Map<string, ProcurementRow>();

  orders
    .filter((o) => dateKey(o.deliveryDate) === targetDateKey)
    .forEach((order) => {
      order.items.forEach((item) => {
        const existing = rows.get(item.fruitId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.orderCount += 1;
        } else {
          rows.set(item.fruitId, {
            fruitId: item.fruitId,
            name: item.name,
            unit: item.unit,
            totalQuantity: item.quantity,
            orderCount: 1,
          });
        }
      });
    });

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}
