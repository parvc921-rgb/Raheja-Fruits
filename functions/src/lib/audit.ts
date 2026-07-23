import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { AdminRole } from "@raheja/shared";

interface WriteAuditLogParams {
  actorId: string;
  actorRole: AdminRole;
  action: string;
  targetType: "fruit" | "customer" | "order" | "building" | "settings";
  targetId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

// Every admin mutation should call this — see architecture doc §4.6 /
// §7.4. Kept as a plain helper (rather than a Firestore trigger on each
// collection) so the audit write happens transactionally alongside the
// mutation it's describing, instead of firing async after the fact.
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  await getFirestore().collection("auditLog").add({
    ...params,
    before: params.before ?? null,
    after: params.after ?? null,
    timestamp: FieldValue.serverTimestamp(),
  });
}
