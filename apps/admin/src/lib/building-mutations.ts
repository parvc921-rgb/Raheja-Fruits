"use client";

import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { writeAuditLog } from "@/lib/audit-log";
import type { AdminRole, Building, BuildingWing } from "@raheja/shared";

export interface BuildingActor {
  uid: string;
  role: AdminRole;
}

/**
 * Case-insensitive duplicate check against the buildings already loaded
 * in the admin's real-time listener (see lib/buildings.ts) — no extra
 * Firestore read needed. Deactivated buildings don't count as a
 * collision, so a retired name can be reused.
 */
export function isDuplicateBuildingName(
  name: string,
  existingBuildings: Building[],
  excludeBuildingId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return existingBuildings.some(
    (b) =>
      b.id !== excludeBuildingId &&
      b.isActive !== false &&
      b.name.trim().toLowerCase() === normalized
  );
}

/**
 * Same idea, but for a wing name within one specific building — wing
 * names only need to be unique inside their own building, not globally.
 */
export function isDuplicateWingName(
  name: string,
  existingWings: BuildingWing[],
  excludeWingId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return existingWings.some(
    (w) =>
      w.id !== excludeWingId &&
      w.active !== false &&
      w.name.trim().toLowerCase() === normalized
  );
}

export function newBuildingId(): string {
  return doc(collection(db, "buildings")).id;
}

export function newWingId(buildingId: string): string {
  return doc(collection(db, "buildings", buildingId, "wings")).id;
}

export async function createBuilding(
  buildingId: string,
  name: string,
  actor: BuildingActor
): Promise<void> {
  const ref = doc(db, "buildings", buildingId);

  await setDoc(ref, {
    name,
    isActive: true,
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "building_created",
    targetType: "building",
    targetId: buildingId,
    before: null,
    after: { name },
  });
}

export async function updateBuildingName(
  building: Building,
  name: string,
  actor: BuildingActor
): Promise<void> {
  const ref = doc(db, "buildings", building.id);

  await updateDoc(ref, {
    name,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "building_updated",
    targetType: "building",
    targetId: building.id,
    before: { name: building.name },
    after: { name },
  });
}

/**
 * Soft delete: marks the building inactive instead of removing the
 * document, so residents already living there keep their history.
 * Firestore Security Rules additionally require super_admin for this
 * specific transition — see firestore.rules, match /buildings's update
 * rule. Existing residents are NOT affected — this only hides the
 * building from the registration/edit-address dropdowns going forward.
 */
export async function deactivateBuilding(building: Building, actor: BuildingActor): Promise<void> {
  const ref = doc(db, "buildings", building.id);

  await updateDoc(ref, {
    isActive: false,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "building_deactivated",
    targetType: "building",
    targetId: building.id,
    before: { isActive: building.isActive !== false },
    after: { isActive: false },
  });
}

export async function createWing(
  buildingId: string,
  wingId: string,
  name: string,
  actor: BuildingActor
): Promise<void> {
  const ref = doc(db, "buildings", buildingId, "wings", wingId);

  await setDoc(ref, {
    name,
    active: true,
  });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "wing_created",
    targetType: "building",
    targetId: buildingId,
    before: null,
    after: { wingId, name },
  });
}

/**
 * Soft delete for a wing — same rationale as deactivateBuilding.
 * Restricted to super_admin at the rules layer.
 */
export async function deactivateWing(
  buildingId: string,
  wing: BuildingWing,
  actor: BuildingActor
): Promise<void> {
  const ref = doc(db, "buildings", buildingId, "wings", wing.id);

  await updateDoc(ref, { active: false });

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "wing_deactivated",
    targetType: "building",
    targetId: buildingId,
    before: { wingId: wing.id, name: wing.name, active: wing.active !== false },
    after: { wingId: wing.id, active: false },
  });
}
