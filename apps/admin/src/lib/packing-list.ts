import { dateKey } from "./delivery-dates";
import type { Order } from "@raheja/shared";

export interface WingGroup {
  wing: string;
  orders: Order[];
}

export interface BuildingGroup {
  buildingId: string;
  wings: WingGroup[];
  orderCount: number;
}

// Orders for the selected delivery date, grouped by building then wing,
// each sorted by flat number — lets delivery staff walk one building
// wing-by-wing instead of hunting through a flat list. See architecture
// doc §7.7.
export function groupOrdersForPacking(orders: Order[], targetDateKey: string): BuildingGroup[] {
  const dayOrders = orders.filter((o) => dateKey(o.deliveryDate) === targetDateKey);

  const byBuilding = new Map<string, Map<string, Order[]>>();
  dayOrders.forEach((order) => {
    if (!byBuilding.has(order.buildingId)) byBuilding.set(order.buildingId, new Map());
    const byWing = byBuilding.get(order.buildingId)!;
    if (!byWing.has(order.wing)) byWing.set(order.wing, []);
    byWing.get(order.wing)!.push(order);
  });

  const groups: BuildingGroup[] = Array.from(byBuilding.entries()).map(
    ([buildingId, byWing]) => {
      const wings: WingGroup[] = Array.from(byWing.entries())
        .map(([wing, wingOrders]) => ({
          wing,
          orders: [...wingOrders].sort((a, b) =>
            a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true })
          ),
        }))
        .sort((a, b) => a.wing.localeCompare(b.wing));

      return {
        buildingId,
        wings,
        orderCount: wings.reduce((sum, w) => sum + w.orders.length, 0),
      };
    }
  );

  return groups.sort((a, b) => b.orderCount - a.orderCount);
}
