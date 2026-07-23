"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Admin } from "@raheja/shared";

// Firestore Security Rules let any active admin list the full `admins`
// collection (see firestore.rules — the read rule's `isAdmin()` branch
// doesn't depend on which specific adminId is being matched, so it
// resolves the same way for every document in a collection query).
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "admins"), orderBy("name", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Admin));
        setLoading(false);
      },
      (err) => {
        console.error("useAdmins subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { admins, loading };
}
