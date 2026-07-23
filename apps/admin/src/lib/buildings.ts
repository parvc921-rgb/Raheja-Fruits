"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Building, BuildingWing } from "@raheja/shared";

// A building's wings live in a subcollection — buildings/{buildingId}/wings
// — not as an array field on the building document itself. Each wing is
// its own doc (fields: name, active) so a wing can be renamed or
// retired independently without rewriting the whole building. The
// Building type's `wings: string[]` is a convenience shape the rest of
// the app (e.g. the Residents page's edit-address form, and the
// customer registration form) expects; useBuildings/useAdminBuildings
// below are what assemble it. No schema change involved — just reading
// from where the data actually lives. (Field name confirmed against
// registerCustomer's own wings lookup in functions/src/auth.ts — it's
// `active`, not `isActive`.)

/**
 * Shared by both useBuildings and useAdminBuildings: attaches a live
 * `wings: string[]` (active wings only) to each building in the given
 * list, via one real-time subcollection listener per building.
 */
function useWingsMerged(buildings: Building[]): Building[] {
  const [wingsByBuilding, setWingsByBuilding] = useState<Record<string, string[]>>({});

  // Stable key so this effect only re-runs when the *set* of building
  // IDs actually changes, not on every unrelated buildings snapshot
  // (e.g. a name edit shouldn't tear down and recreate every wings
  // subscription).
  const buildingIdsKey = useMemo(() => buildings.map((b) => b.id).sort().join(","), [buildings]);

  useEffect(() => {
    if (buildings.length === 0) {
      setWingsByBuilding({});
      return;
    }

    const unsubscribers = buildings.map((building) => {
      const wingsQuery = query(
        collection(db, "buildings", building.id, "wings"),
        where("active", "==", true)
      );

      return onSnapshot(
        wingsQuery,
        (snap) => {
          const wingNames = snap.docs
            .map((d) => (d.data().name as string | undefined) ?? d.id)
            .sort((a, b) => a.localeCompare(b));

          setWingsByBuilding((prev) => ({ ...prev, [building.id]: wingNames }));
        },
        (err) => {
          console.error(`wings subscription failed for building ${building.id}`, err);
        }
      );
    });

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on buildingIdsKey, not `buildings`, to avoid resubscribing on every unrelated field change
  }, [buildingIdsKey]);

  return useMemo(
    () => buildings.map((building) => ({ ...building, wings: wingsByBuilding[building.id] ?? [] })),
    [buildings, wingsByBuilding]
  );
}

// Active buildings only, wings as plain strings — what the registration
// form and Residents edit-address dropdowns want.
export function useBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "buildings"),
      where("isActive", "==", true),
      orderBy("name", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setBuildings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Building));
        setLoading(false);
      },
      (err) => {
        console.error("useBuildings subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const buildingsWithWings = useWingsMerged(buildings);

  return { buildings: buildingsWithWings, loading };
}

// --- Admin-only additions below, for the Buildings management page ---

/**
 * Every building, active or not — the management table needs to show
 * deactivated buildings too (with a status badge), unlike every other
 * consumer of buildings data which only ever wants the active ones.
 */
export function useAdminBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "buildings"), orderBy("name", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setBuildings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Building));
        setLoading(false);
      },
      (err) => {
        console.error("useAdminBuildings subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const buildingsWithWings = useWingsMerged(buildings);

  return { buildings: buildingsWithWings, loading };
}

/**
 * Every wing doc (active or not) for one specific building, with its
 * Firestore doc ID intact — needed so the management UI can target a
 * specific wing to deactivate. The wings attached by the hooks above
 * are plain strings with no ID, which is enough for a read-only
 * dropdown but not for this.
 */
export function useBuildingWings(buildingId: string | null) {
  const [wings, setWings] = useState<BuildingWing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buildingId) {
      setWings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "buildings", buildingId, "wings"), orderBy("name", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setWings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BuildingWing));
        setLoading(false);
      },
      (err) => {
        console.error(`useBuildingWings subscription failed for ${buildingId}`, err);
        setLoading(false);
      }
    );

    return unsub;
  }, [buildingId]);

  return { wings, loading };
}
