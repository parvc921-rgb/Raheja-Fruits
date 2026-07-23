"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Fruit } from "@raheja/shared";

// Unlike the customer catalogue's useFruits (which filters to
// isAvailable == true), admins need to see everything, including
// Out of Stock items, so they can toggle them back on.
export function useAllFruits() {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "fruits"), orderBy("sortOrder", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFruits(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Fruit));
        setLoading(false);
      },
      (err) => {
        console.error("useAllFruits subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { fruits, loading };
}
