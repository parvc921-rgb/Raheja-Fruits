"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Fruit } from "@raheja/shared";

interface UseFruitsResult {
  fruits: Fruit[];
  loading: boolean;
  error: string | null;
}

// Milestone 1: a read-only, real-time view of the full fruits catalogue
// for the admin listing page (search/filter/pagination all happen
// client-side over this list — see /fruits/page.tsx). Ordered by
// sortOrder to match the order fruits appear in the customer catalogue.
//
// Note: apps/admin/src/lib/fruits.ts already exports a very similar
// useAllFruits() used by the Milestone 2 CRUD table. This hook is kept
// separate (and named per the Milestone 1 spec) so the listing page
// doesn't depend on Milestone 2 code, and vice versa.
export function useFruits(): UseFruitsResult {
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "fruits"), orderBy("sortOrder", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFruits(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Fruit));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useFruits subscription failed", err);
        setError("Couldn't load fruits. Please refresh the page.");
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { fruits, loading, error };
}
