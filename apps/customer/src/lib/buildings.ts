"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Building } from "@raheja/shared";

// Registration needs the full list of active buildings (with their
// wings) for its Building/Wing dropdowns. Wings live in a subcollection
// (buildings/{buildingId}/wings), not an array field on the building
// doc — see apps/admin/src/lib/buildings.ts for the original version of
// this hook and why the field names differ (isActive on the building
// doc, active on each wing doc).
export function useBuildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [wingsByBuilding, setWingsByBuilding] = useState<Record<string, string[]>>({});
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

  const buildingIdsKey = useMemo(
    () => buildings.map((b) => b.id).sort().join(","),
    [buildings]
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on buildingIdsKey, not `buildings`, to avoid resubscribing on every unrelated field change
  }, [buildingIdsKey]);

  const buildingsWithWings: Building[] = useMemo(
    () =>
      buildings.map((building) => ({
        ...building,
        wings: wingsByBuilding[building.id] ?? [],
      })),
    [buildings, wingsByBuilding]
  );

  return { buildings: buildingsWithWings, loading };
}

// A single getDoc, not a subscription — the building name for an
// address display doesn't need to be real-time, and Security Rules
// allow any signed-in customer to read `buildings` for exactly this
// kind of lookup.
export function useBuilding(buildingId: string | undefined) {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buildingId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDoc(doc(db, "buildings", buildingId))
      .then((snap) => {
        if (cancelled) return;
        setBuilding(snap.exists() ? ({ id: snap.id, ...snap.data() } as Building) : null);
      })
      .catch((err) => console.error("useBuilding failed", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  return { building, loading };
}
