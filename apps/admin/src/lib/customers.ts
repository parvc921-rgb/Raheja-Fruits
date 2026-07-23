"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Customer, Order } from "@raheja/shared";

// Firestore Security Rules let an admin read any customers doc (see
// firestore.rules, match /customers/{customerId}). pinHash is present
// in the raw doc but never rendered anywhere in the admin UI.
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Customer));
        setLoading(false);
      },
      (err) => {
        console.error("useCustomers subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { customers, loading };
}

// Used by the customer detail panel — admins can read any order (see
// firestore.rules, match /orders/{orderId}), scoped here to one customer.
export function useCustomerOrderHistory(customerId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", customerId),
      orderBy("placedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
        setLoading(false);
      },
      (err) => {
        console.error("useCustomerOrderHistory subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [customerId]);

  return { orders, loading };
}
