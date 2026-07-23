"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Order, OrderStatus } from "@raheja/shared";

// Firestore Security Rules restrict order reads to the order's own
// customer or an admin (see firestore.rules). Pulls the most recent 200
// orders — plenty for a single residential society's order volume — and
// lets the dashboard/Orders page derive stats and filters client-side,
// rather than standing up a composite index per filter combination.
export function useRecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("placedAt", "desc"), limit(200));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
        setLoading(false);
      },
      (err) => {
        console.error("useRecentOrders subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { orders, loading };
}

// Orders still moving through the pipeline, as opposed to a finished
// state (delivered/undelivered). This is what "today's orders" means
// operationally for an admin — what still needs procurement/packing.
export const ACTIVE_STATUSES: OrderStatus[] = ["placed", "packed", "out_for_delivery"];
