"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useAdminBuildings } from "@/lib/buildings";
import { deactivateBuilding } from "@/lib/building-mutations";
import { BuildingForm } from "@/components/buildings/building-form";
import { BuildingsTable } from "@/components/buildings/buildings-table";
import type { Building } from "@raheja/shared";

// canWrite mirrors firestore.rules' buildings create/update rule
// (super_admin + operations); canDeactivate mirrors the update rule's
// extra super_admin-only condition for flipping isActive to false —
// same split as the Fruits page.
export default function BuildingsPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "operations", "read_only"]);
  const { admin } = useAuth();
  const { buildings, loading: buildingsLoading } = useAdminBuildings();

  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = admin?.role === "super_admin" || admin?.role === "operations";
  const canDeactivate = admin?.role === "super_admin";

  const handleDeactivate = async (building: Building) => {
    if (!admin) return;
    const confirmed = confirm(
      `Deactivate ${building.name}? It'll disappear from the registration and address-edit dropdowns, but existing residents keep their address.`
    );
    if (!confirmed) return;

    setActionError(null);
    setDeactivatingId(building.id);
    try {
      await deactivateBuilding(building, { uid: admin.id, role: admin.role });
      if (editingBuilding?.id === building.id) setEditingBuilding(null);
    } catch (err) {
      console.error("deactivateBuilding failed", err);
      setActionError("Couldn't deactivate this building. Please try again.");
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading || !authorized) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Buildings</h1>

      <div className={canWrite ? "grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]" : ""}>
        {canWrite && (
          <BuildingForm
            editingBuilding={editingBuilding}
            existingBuildings={buildings}
            canDeactivateWings={canDeactivate}
            onSaved={() => setEditingBuilding(null)}
            onCancelEdit={() => setEditingBuilding(null)}
          />
        )}

        <div>
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}

          {buildingsLoading ? (
            <p className="text-sm text-muted-foreground">Loading buildings…</p>
          ) : buildings.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No buildings yet.{canWrite ? " Use the form to add the first one." : ""}
            </p>
          ) : (
            <BuildingsTable
              buildings={buildings}
              onEdit={setEditingBuilding}
              onDeactivate={handleDeactivate}
              editingBuildingId={editingBuilding?.id ?? null}
              deactivatingId={deactivatingId}
              canWrite={canWrite}
              canDeactivate={canDeactivate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
