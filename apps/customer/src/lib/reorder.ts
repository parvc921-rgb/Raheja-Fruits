import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Order, Fruit } from "@raheja/shared";
import type { CartLine } from "@/store/cart-store";

export interface ReorderResult {
  lines: Omit<CartLine, "quantity">[];
  quantities: Record<string, number>;
  skipped: string[]; // names of items that are no longer available
}

// Reorder never trusts the price/availability snapshotted on the old
// order — it re-fetches each fruit's *current* doc so the customer adds
// today's prices to their cart, and silently drops anything that's gone
// Out of Stock or been removed from the catalogue since. See
// architecture doc §6.4.
export async function buildReorder(order: Order): Promise<ReorderResult> {
  const lines: Omit<CartLine, "quantity">[] = [];
  const quantities: Record<string, number> = {};
  const skipped: string[] = [];

  await Promise.all(
    order.items.map(async (item) => {
      const snap = await getDoc(doc(db, "fruits", item.fruitId));
      if (!snap.exists()) {
        skipped.push(item.name);
        return;
      }
      const fruit = snap.data() as Fruit;
      if (!fruit.isAvailable) {
        skipped.push(fruit.name);
        return;
      }
      lines.push({
        fruitId: snap.id,
        name: fruit.name,
        unit: fruit.unit,
        retailPrice: fruit.retailPrice,
        memberPrice: fruit.memberPrice,
      });
      quantities[snap.id] = item.quantity;
    })
  );

  return { lines, quantities, skipped };
}
