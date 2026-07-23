import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  setCustomerStatusSchema,
  updateCustomerAddressSchema,
  type CustomerMutationResult,
  type Customer,
  type Building,
} from "@raheja/shared";
import { requireAdmin } from "./lib/require-admin";
import { writeAuditLog } from "./lib/audit";

const db = () => getFirestore();

/**
 * setCustomerStatus — admin-only (super_admin/operations, per §7.2).
 * Firestore Security Rules intentionally block a customer's own status
 * field from being admin-writable directly (see firestore.rules, match
 * /customers/{customerId}) so that every status change is audit-logged
 * rather than a silent direct write.
 */
export const setCustomerStatus = onCall<unknown, Promise<CustomerMutationResult>>(
  async (request) => {
    const { uid, admin } = await requireAdmin(request, ["super_admin", "operations"]);

    const parsed = setCustomerStatusSchema.safeParse(request.data);
    if (!parsed.success) {
      return { ok: false, error: "Invalid request." };
    }
    const { customerId, status } = parsed.data;

    const ref = db().collection("customers").doc(customerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, error: "Customer not found." };
    }
    const before = snap.data() as Customer;

    if (before.status === status) {
      return { ok: true }; // no-op, nothing to change or log
    }

    await ref.update({ status });

    await writeAuditLog({
      actorId: uid,
      actorRole: admin.role,
      action: "customer_status_changed",
      targetType: "customer",
      targetId: customerId,
      before: { status: before.status },
      after: { status },
    });

    return { ok: true };
  }
);

/**
 * updateCustomerAddress — admin-only (super_admin/operations, per §7.2,
 * same roles as setCustomerStatus). Re-validates the building/wing the
 * same way registerCustomer does, so an admin can't set a resident's
 * address to a building/wing that doesn't exist or has been retired.
 */
export const updateCustomerAddress = onCall<unknown, Promise<CustomerMutationResult>>(
  async (request) => {
    const { uid, admin } = await requireAdmin(request, ["super_admin", "operations"]);

    const parsed = updateCustomerAddressSchema.safeParse(request.data);
    if (!parsed.success) {
      return { ok: false, error: "Please check the form and try again." };
    }
    const { customerId, buildingId, wing, flatNumber } = parsed.data;

    const ref = db().collection("customers").doc(customerId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, error: "Customer not found." };
    }
    const before = snap.data() as Customer;

    const buildingSnap = await db().collection("buildings").doc(buildingId).get();
    if (!buildingSnap.exists) {
      return { ok: false, error: "Selected building not found." };
    }
    const building = buildingSnap.data() as Building;

    const wingSnap = await db()
      .collection("buildings")
      .doc(buildingId)
      .collection("wings")
      .where("name", "==", wing)
      .where("active", "==", true)
      .limit(1)
      .get();
    if (wingSnap.empty) {
      return { ok: false, error: `Wing "${wing}" isn't part of ${building.name}.` };
    }

    const address = `${building.name}, Wing ${wing}, Flat ${flatNumber}`;

    await ref.update({
      buildingId,
      buildingName: building.name,
      wing,
      flatNumber,
      address,
    });

    await writeAuditLog({
      actorId: uid,
      actorRole: admin.role,
      action: "customer_address_updated",
      targetType: "customer",
      targetId: customerId,
      before: {
        buildingId: before.buildingId,
        wing: before.wing,
        flatNumber: before.flatNumber,
      },
      after: { buildingId, wing, flatNumber },
    });

    return { ok: true };
  }
);
