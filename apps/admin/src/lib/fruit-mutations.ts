"use client";

import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { writeAuditLog } from "@/lib/audit-log";
import type { AdminRole, Fruit } from "@raheja/shared";

export interface FruitActor {
  uid: string;
  role: AdminRole;
}

// The subset of Fruit fields the form actually collects — everything
// else (isActive, createdAt/createdBy, updatedAt/updatedBy) is stamped
// on by these mutation functions, never by the form itself.
export interface FruitFormFields {
  name: string;
  unit: string;
  category: string | null;
  retailPrice: number;
  memberPrice: number;
  sortOrder: number;
  imageUrl: string;
}

/**
 * Case-insensitive duplicate check against the fruits already loaded in
 * the admin's real-time listener (see hooks/use-fruits.ts) — no extra
 * Firestore read needed. Deactivated (soft-deleted) fruits don't count
 * as a collision, so a retired name can be reused.
 */
export function isDuplicateFruitName(
  name: string,
  existingFruits: Fruit[],
  excludeFruitId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return existingFruits.some(
    (fruit) =>
      fruit.id !== excludeFruitId &&
      fruit.isActive !== false &&
      fruit.name.trim().toLowerCase() === normalized
  );
}

// Fruit IDs are pre-generated client-side (rather than via addDoc) so
// the same ID can be used for the Storage path (fruit-images/{fruitId})
// *before* the Firestore document exists yet.
export function newFruitId(): string {
  return doc(collection(db, "fruits")).id;
}

export async function createFruit(
  fruitId: string,
  fields: FruitFormFields,
  actor: FruitActor
): Promise<void> {
  const ref = doc(db, "fruits", fruitId);

  await setDoc(ref, {
    ...fields,
    isAvailable: true,
    isActive: true,
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "fruit_created",
    targetType: "fruit",
    targetId: fruitId,
    before: null,
    after: { ...fields },
  });
}

export async function updateFruit(
  fruitId: string,
  fields: FruitFormFields,
  before: FruitFormFields,
  actor: FruitActor
): Promise<void> {
  const ref = doc(db, "fruits", fruitId);

  await updateDoc(ref, {
    ...fields,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "fruit_updated",
    targetType: "fruit",
    targetId: fruitId,
    before: { ...before },
    after: { ...fields },
  });
}

/**
 * Soft delete: marks the fruit inactive (and out of stock) instead of
 * removing the document. Firestore Security Rules additionally require
 * super_admin for this specific transition — see firestore.rules,
 * match /fruits/{fruitId}'s update rule.
 */
export async function deactivateFruit(fruit: Fruit, actor: FruitActor): Promise<void> {
  const ref = doc(db, "fruits", fruit.id);

  await updateDoc(ref, {
    isActive: false,
    isAvailable: false,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "fruit_deactivated",
    targetType: "fruit",
    targetId: fruit.id,
    before: { isActive: fruit.isActive !== false, isAvailable: fruit.isAvailable },
    after: { isActive: false, isAvailable: false },
  });
}
