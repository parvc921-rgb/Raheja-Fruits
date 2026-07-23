"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Order } from "@raheja/shared";
import type { User } from "firebase/auth";

export function useCustomerOrders(user: User | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("customerId", "==", user.uid),
      orderBy("placedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          orderNumber: doc.data().orderNumber ?? "",
          ...doc.data(),
        })) as Order[];

        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("useCustomerOrders subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  return { orders, loading };
}