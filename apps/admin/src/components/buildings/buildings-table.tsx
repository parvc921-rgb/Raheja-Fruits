"use client";

import type { Building } from "@raheja/shared";

interface BuildingsTableProps {
  buildings: Building[];
  onEdit?: (building: Building) => void;
  onDeactivate?: (building: Building) => void;
  editingBuildingId?: string | null;
  deactivatingId?: string | null;
  canWrite?: boolean;
  canDeactivate?: boolean;
}

export function BuildingsTable({
  buildings,
  onEdit,
  onDeactivate,
  editingBuildingId = null,
  deactivatingId = null,
  canWrite = false,
  canDeactivate = false,
}: BuildingsTableProps) {
  const showActions = canWrite || canDeactivate;

  if (buildings.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No buildings yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Wings</th>
            <th className="px-3 py-2 font-medium">Status</th>
            {showActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {buildings.map((building) => (
            <tr
              key={building.id}
              className={`border-t border-border ${editingBuildingId === building.id ? "bg-primary/5" : ""}`}
            >
              <td className="px-3 py-2 font-medium">{building.name}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {building.wings.length > 0 ? building.wings.join(", ") : "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    building.isActive !== false
                      ? "bg-primary/10 text-primary"
                      : "bg-berry/10 text-berry"
                  }`}
                >
                  {building.isActive !== false ? "Active" : "Deactivated"}
                </span>
              </td>
              {showActions && (
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {canWrite && onEdit && (
                      <button
                        onClick={() => onEdit(building)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDeactivate && onDeactivate && building.isActive !== false && (
                      <button
                        onClick={() => onDeactivate(building)}
                        disabled={deactivatingId === building.id}
                        className="text-xs font-medium text-berry hover:underline disabled:opacity-50"
                      >
                        {deactivatingId === building.id ? "Deactivating…" : "Deactivate"}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
