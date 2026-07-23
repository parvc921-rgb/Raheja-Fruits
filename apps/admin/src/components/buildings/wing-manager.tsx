"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBuildingWings } from "@/lib/buildings";
import {
  createWing,
  deactivateWing,
  isDuplicateWingName,
  newWingId,
} from "@/lib/building-mutations";

interface WingManagerProps {
  buildingId: string;
  canDeactivate: boolean;
}

export function WingManager({ buildingId, canDeactivate }: WingManagerProps) {
  const { admin } = useAuth();
  const { wings, loading } = useBuildingWings(buildingId);
  const [newWingName, setNewWingName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [retiringId, setRetiringId] = useState<string | null>(null);

  const activeWings = wings.filter((w) => w.active !== false);

  const handleAddWing = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const name = newWingName.trim();
    if (!name) {
      setAddError("Enter a wing name.");
      return;
    }
    if (isDuplicateWingName(name, wings)) {
      setAddError("This wing already exists.");
      return;
    }
    if (!admin) {
      setAddError("Your session expired. Please sign in again.");
      return;
    }

    setAdding(true);
    try {
      const wingId = newWingId(buildingId);
      await createWing(buildingId, wingId, name, { uid: admin.id, role: admin.role });
      setNewWingName("");
    } catch (err) {
      console.error("createWing failed", err);
      setAddError("Couldn't add this wing. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleRetireWing = async (wingId: string, wingName: string) => {
    if (!admin) return;
    const wing = wings.find((w) => w.id === wingId);
    if (!wing) return;
    if (!confirm(`Retire wing "${wingName}"? Residents already in it keep their address.`)) return;

    setRetiringId(wingId);
    try {
      await deactivateWing(buildingId, wing, { uid: admin.id, role: admin.role });
    } catch (err) {
      console.error("deactivateWing failed", err);
      alert("Couldn't retire this wing. Please try again.");
    } finally {
      setRetiringId(null);
    }
  };

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Wings</h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading wings…</p>
      ) : activeWings.length === 0 ? (
        <p className="mb-2 text-sm text-muted-foreground">No wings yet.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-1">
          {activeWings.map((wing) => (
            <li
              key={wing.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
            >
              <span>{wing.name}</span>
              {canDeactivate && (
                <button
                  onClick={() => handleRetireWing(wing.id, wing.name)}
                  disabled={retiringId === wing.id}
                  className="text-xs font-medium text-berry hover:underline disabled:opacity-50"
                >
                  {retiringId === wing.id ? "Retiring…" : "Retire"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAddWing} className="flex gap-2">
        <input
          value={newWingName}
          onChange={(e) => setNewWingName(e.target.value)}
          placeholder="e.g. C"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add wing"}
        </button>
      </form>
      {addError && <p className="mt-1 text-sm text-red-600">{addError}</p>}
    </div>
  );
}
