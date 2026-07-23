"use client";

import type { Fruit } from "@raheja/shared";

interface FruitsTableProps {
  fruits: Fruit[];
  emptyMessage?: string;
  // Milestone 2 actions — all optional so this table still works as a
  // plain read-only listing (as it did in Milestone 1) if a caller
  // doesn't wire them up.
  onEdit?: (fruit: Fruit) => void;
  onDeactivate?: (fruit: Fruit) => void;
  editingFruitId?: string | null;
  deactivatingId?: string | null;
  canWrite?: boolean;
  canDeactivate?: boolean;
}

export function FruitsTable({
  fruits,
  emptyMessage = "No fruits match these filters.",
  onEdit,
  onDeactivate,
  editingFruitId = null,
  deactivatingId = null,
  canWrite = false,
  canDeactivate = false,
}: FruitsTableProps) {
  const showActions = canWrite || canDeactivate;

  if (fruits.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium" />
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Retail</th>
            <th className="px-3 py-2 font-medium">Member</th>
            <th className="px-3 py-2 font-medium">Status</th>
            {showActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {fruits.map((fruit) => (
            <tr
              key={fruit.id}
              className={`border-t border-border ${editingFruitId === fruit.id ? "bg-primary/5" : ""}`}
            >
              <td className="px-3 py-2">
                <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                  {fruit.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- small thumbnail in an admin table, next/image isn't worth it here
                    <img src={fruit.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                <p className="font-medium">{fruit.name}</p>
                <p className="text-xs text-muted-foreground">per {fruit.unit}</p>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{fruit.category ?? "Uncategorized"}</td>
              <td className="px-3 py-2">₹{fruit.retailPrice}</td>
              <td className="px-3 py-2 font-medium text-primary">₹{fruit.memberPrice}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    fruit.isAvailable ? "bg-primary/10 text-primary" : "bg-berry/10 text-berry"
                  }`}
                >
                  {fruit.isAvailable ? "In stock" : "Out of stock"}
                </span>
              </td>
              {showActions && (
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    {canWrite && onEdit && (
                      <button
                        onClick={() => onEdit(fruit)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDeactivate && onDeactivate && (
                      <button
                        onClick={() => onDeactivate(fruit)}
                        disabled={deactivatingId === fruit.id}
                        className="text-xs font-medium text-berry hover:underline disabled:opacity-50"
                      >
                        {deactivatingId === fruit.id ? "Deactivating…" : "Deactivate"}
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
