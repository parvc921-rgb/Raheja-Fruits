"use client";

import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import type { AuditLogEntry } from "@raheja/shared";

interface WriteAuditLogParams {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: "fruit" | "customer" | "order" | "building" | "settings";
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

// Milestone 2: fruit create/update/deactivate write their own audit
// entry directly from the admin client (see lib/fruit-mutations.ts),
// mirroring the shape functions/src/lib/audit.ts writes server-side for
// every other mutation — so both paths render identically in the Audit
// Log screen regardless of which one wrote them. Firestore Security
// Rules (match /auditLog/{logId}) keep this create-only and enforce
// actorId == the signed-in admin.
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  await addDoc(collection(db, "auditLog"), {
    ...params,
    timestamp: serverTimestamp(),
  });
}

// Firestore Security Rules restrict this to admins (see firestore.rules,
// match /auditLog/{logId} — read: isAdmin(), write: always false, since
// every entry is written server-side by writeAuditLog() alongside the
// mutation it describes). Pulls the most recent 200 entries; older
// history is still in Firestore if a wider search is ever needed, just
// not loaded into this view by default.
export function useAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "auditLog"), orderBy("timestamp", "desc"), limit(200));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLogEntry));
        setLoading(false);
      },
      (err) => {
        console.error("useAuditLog subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { entries, loading };
}
