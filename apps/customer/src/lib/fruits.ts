"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Fruit } from "@raheja/shared";

// Real-time so an admin toggling something Out of Stock at 7:55pm is
// reflected instantly for anyone browsing — no stale "add to cart" for
// an item that just sold out. Security Rules already scope read access
// to active customers, so this query is safe to run straight from the
// client.
export function useFruits() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "fruits"),
      where("isAvailable", "==", true),
      orderBy("sortOrder", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFruits(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Fruit));
        setLoading(false);
      },
      (err) => {
        console.error("useFruits subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { fruits, loading };
}
