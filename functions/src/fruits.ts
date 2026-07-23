import { onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  fruitUpsertSchema,
  toggleFruitAvailabilitySchema,
  deleteFruitSchema,
  type UpsertFruitResult,
  type FruitMutationResult,
  type Fruit,
} from "@raheja/shared";
import { requireAdmin } from "./lib/require-admin";
import { writeAuditLog } from "./lib/audit";

const db = () => getFirestore();
const FRUIT_ROLES = ["super_admin", "procurement"] as const;

/**
 * upsertFruit — admin-only (super_admin/procurement). Creates a new
 * fruit or updates an existing one depending on whether `fruitId` is
 * present in the input. Every call writes an audit entry with the
 * before/after values. See architecture doc §7.4 / §4.4.
 */
export const upsertFruit = onCall<unknown, Promise<UpsertFruitResult>>(async (request) => {
  const { uid, admin } = await requireAdmin(request, [...FRUIT_ROLES]);

  const parsed = fruitUpsertSchema.safeParse(request.data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { fruitId, ...fields } = parsed.data;

  if (fruitId) {
    const ref = db().collection("fruits").doc(fruitId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, error: "Fruit not found." };
    }
    const before = snap.data() as Fruit;

    const after = {
      ...fields,
      category: fields.category ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    };
    await ref.update(after);

    await writeAuditLog({
      actorId: uid,
      actorRole: admin.role,
      action: "fruit_updated",
      targetType: "fruit",
      targetId: fruitId,
      before: { ...before },
      after: { ...fields },
    });

    return { ok: true, fruitId };
  }

  const ref = db().collection("fruits").doc();
  const fruit: Omit<Fruit, "id"> = {
    name: fields.name,
    unit: fields.unit,
    imageUrl: fields.imageUrl ?? "",
    retailPrice: fields.retailPrice,
    memberPrice: fields.memberPrice,
    category: fields.category ?? null,
    sortOrder: fields.sortOrder,
    isAvailable: true,
    isActive: true,
    createdAt: FieldValue.serverTimestamp() as unknown as string,
    createdBy: uid,
    updatedAt: FieldValue.serverTimestamp() as unknown as string,
    updatedBy: uid,
  };
  await ref.set(fruit);

  await writeAuditLog({
    actorId: uid,
    actorRole: admin.role,
    action: "fruit_created",
    targetType: "fruit",
    targetId: ref.id,
    before: null,
    after: { ...fields },
  });

  return { ok: true, fruitId: ref.id };
});

/**
 * toggleFruitAvailability — the fast one-click Available/Out of Stock
 * switch on the fruit list, kept separate from upsertFruit so flipping
 * stock status doesn't require the full edit form.
 */
export const toggleFruitAvailability = onCall<unknown, Promise<FruitMutationResult>>(
  async (request) => {
    const { uid, admin } = await requireAdmin(request, [...FRUIT_ROLES]);

    const parsed = toggleFruitAvailabilitySchema.safeParse(request.data);
    if (!parsed.success) {
      return { ok: false, error: "Invalid request." };
    }
    const { fruitId, isAvailable } = parsed.data;

    const ref = db().collection("fruits").doc(fruitId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { ok: false, error: "Fruit not found." };
    }
    const before = snap.data() as Fruit;

    await ref.update({
      isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });

    await writeAuditLog({
      actorId: uid,
      actorRole: admin.role,
      action: "fruit_availability_toggled",
      targetType: "fruit",
      targetId: fruitId,
      before: { isAvailable: before.isAvailable },
      after: { isAvailable },
    });

    return { ok: true };
  }
);

/**
 * deleteFruit — super_admin only (more destructive than a price/stock
 * change, so restricted to a narrower role than upsert/toggle).
 *
 * Milestone 2: soft delete. Marks the fruit inactive (and out of stock)
 * instead of removing the document, so its record and audit history are
 * preserved — matches the client-side deactivateFruit() in
 * apps/admin/src/lib/fruit-mutations.ts, which is what the admin UI
 * actually calls; this Cloud Function is kept in sync for parity but
 * isn't currently invoked by the app.
 */
export const deleteFruit = onCall<unknown, Promise<FruitMutationResult>>(async (request) => {
  const { uid, admin } = await requireAdmin(request, ["super_admin"]);

  const parsed = deleteFruitSchema.safeParse(request.data);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const ref = db().collection("fruits").doc(parsed.data.fruitId);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, error: "Fruit not found." };
  }
  const before = snap.data() as Fruit;

  await ref.update({
    isActive: false,
    isAvailable: false,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  });

  await writeAuditLog({
    actorId: uid,
    actorRole: admin.role,
    action: "fruit_deactivated",
    targetType: "fruit",
    targetId: parsed.data.fruitId,
    before: { isActive: before.isActive !== false, isAvailable: before.isAvailable },
    after: { isActive: false, isAvailable: false },
  });

  return { ok: true };
});
