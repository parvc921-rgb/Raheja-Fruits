import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  orderStatusUpdateSchema,
  canTransitionOrderStatus,
  type OrderMutationResult,
  type Order,
} from "@raheja/shared";
import { requireAdmin } from "./lib/require-admin";
import { writeAuditLog } from "./lib/audit";

const db = () => getFirestore();

/**
 * updateOrderStatus — admin-only (super_admin/operations, matching the
 * Packing List page's role gate). Rejects any transition not allowed by
 * ORDER_STATUS_TRANSITIONS (@raheja/shared) regardless of what the
 * client sends — the client only shows legal next-steps as buttons, but
 * this is the actual enforcement. See architecture doc §7.7.
 */
export const updateOrderStatus = onCall<unknown, Promise<OrderMutationResult>>(
  async (request) => {
    const { uid, admin } = await requireAdmin(request, ["super_admin", "operations"]);

    const parsed = orderStatusUpdateSchema.safeParse(request.data);
    if (!parsed.success) {
      return { ok: false, error: "Invalid request." };
    }
    const { orderId, status } = parsed.data;

    const ref = db().collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, error: "Order not found." };
    }
    const order = snap.data() as Order;

    if (order.status === status) {
      return { ok: true }; // no-op
    }

    if (!canTransitionOrderStatus(order.status, status)) {
      return {
        ok: false,
        error: `Can't move an order from "${order.status}" to "${status}".`,
      };
    }

    await ref.update({ status });

    await writeAuditLog({
      actorId: uid,
      actorRole: admin.role,
      action: "order_status_changed",
      targetType: "order",
      targetId: orderId,
      before: { status: order.status },
      after: { status },
    });

    return { ok: true };
  }
);
