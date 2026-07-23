"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";
import { useAllFruits } from "@/lib/fruits";
import type { Fruit, FruitMutationResult } from "@raheja/shared";

interface FruitTableProps {
  onEdit: (fruit: Fruit) => void;
  editingFruitId: string | null;
  canWrite: boolean;
  canDelete: boolean;
}

export function FruitTable({ onEdit, editingFruitId, canWrite, canDelete }: FruitTableProps) {
  const { fruits, loading } = useAllFruits();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggle = async (fruit: Fruit) => {
    setTogglingId(fruit.id);
    try {
      const toggle = httpsCallable<
        { fruitId: string; isAvailable: boolean },
        FruitMutationResult
      >(functions, "toggleFruitAvailability");
      const { data } = await toggle({ fruitId: fruit.id, isAvailable: !fruit.isAvailable });
      if (!data.ok) console.error("toggleFruitAvailability failed", data.error);
    } catch (err) {
      console.error("toggleFruitAvailability failed", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (fruit: Fruit) => {
    if (!confirm(`Delete ${fruit.name}? This can't be undone.`)) return;
    setDeletingId(fruit.id);
    try {
      const del = httpsCallable<{ fruitId: string }, FruitMutationResult>(
        functions,
        "deleteFruit"
      );
      const { data } = await del({ fruitId: fruit.id });
      if (!data.ok) console.error("deleteFruit failed", data.error);
    } catch (err) {
      console.error("deleteFruit failed", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading fruits…</p>;
  }

  if (fruits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No fruits yet. Add one using the form.
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
            <th className="px-3 py-2 font-medium">Retail</th>
            <th className="px-3 py-2 font-medium">Member</th>
            <th className="px-3 py-2 font-medium">Available</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {fruits.map((fruit) => (
            <tr
              key={fruit.id}
              className={`border-t border-border ${
                editingFruitId === fruit.id ? "bg-primary/5" : ""
              }`}
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
              <td className="px-3 py-2">₹{fruit.retailPrice}</td>
              <td className="px-3 py-2 font-medium text-primary">₹{fruit.memberPrice}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => handleToggle(fruit)}
                  disabled={togglingId === fruit.id || !canWrite}
                  aria-pressed={fruit.isAvailable}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:cursor-default disabled:opacity-70 ${
                    fruit.isAvailable
                      ? "bg-primary/10 text-primary"
                      : "bg-berry/10 text-berry"
                  }`}
                >
                  {togglingId === fruit.id
                    ? "…"
                    : fruit.isAvailable
                      ? "In stock"
                      : "Out of stock"}
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-3">
                  {canWrite && (
                    <button
                      onClick={() => onEdit(fruit)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(fruit)}
                      disabled={deletingId === fruit.id}
                      className="text-xs font-medium text-berry hover:underline disabled:opacity-50"
                    >
                      {deletingId === fruit.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
