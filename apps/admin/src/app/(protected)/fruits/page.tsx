"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useFruits } from "@/hooks/use-fruits";
import { deactivateFruit } from "@/lib/fruit-mutations";
import {
  DEFAULT_FRUIT_FILTERS,
  FruitsFilterBar,
  type FruitFilters,
} from "@/components/fruits/fruits-filter-bar";
import { FruitsTable } from "@/components/fruits/fruits-table";
import { FruitsPagination } from "@/components/fruits/fruits-pagination";
import { FruitForm } from "@/components/fruits/fruit-form";
import type { Fruit } from "@raheja/shared";

const PAGE_SIZE = 10;

// Milestone 1 (listing: search/category/status filters, pagination,
// real-time data) + Milestone 2 (Add/Edit via FruitForm, soft delete).
// canWrite mirrors firestore.rules' fruits create/update rule
// (super_admin + procurement); canDeactivate mirrors the update rule's
// extra super_admin-only condition for flipping isActive to false.
export default function FruitsPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin", "procurement", "read_only"]);
  const { admin } = useAuth();
  const { fruits, loading: fruitsLoading, error } = useFruits();

  const [filters, setFilters] = useState<FruitFilters>(DEFAULT_FRUIT_FILTERS);
  const [page, setPage] = useState(1);
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = admin?.role === "super_admin" || admin?.role === "procurement";
  const canDeactivate = admin?.role === "super_admin";

  // Soft-deleted fruits are excluded from the listing entirely (they
  // still exist in Firestore for audit history — see
  // lib/fruit-mutations.ts's deactivateFruit). Docs written before
  // isActive existed have it undefined, treated as active.
  const activeFruits = useMemo(() => fruits.filter((f) => f.isActive !== false), [fruits]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    activeFruits.forEach((fruit) => {
      if (fruit.category) set.add(fruit.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeFruits]);

  const filteredFruits = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return activeFruits.filter((fruit) => {
      if (term && !fruit.name.toLowerCase().includes(term)) return false;
      if (filters.category && fruit.category !== filters.category) return false;
      if (filters.status === "available" && !fruit.isAvailable) return false;
      if (filters.status === "out_of_stock" && fruit.isAvailable) return false;
      return true;
    });
  }, [activeFruits, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredFruits.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedFruits = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFruits.slice(start, start + PAGE_SIZE);
  }, [filteredFruits, currentPage]);

  const handleFiltersChange = (next: FruitFilters) => {
    setFilters(next);
    setPage(1); // reset to first page whenever filters change
  };

  const handleDeactivate = async (fruit: Fruit) => {
    if (!admin) return;
    const confirmed = confirm(
      `Deactivate ${fruit.name}? It'll disappear from this list and the customer catalogue, but its record and history are kept.`
    );
    if (!confirmed) return;

    setActionError(null);
    setDeactivatingId(fruit.id);
    try {
      await deactivateFruit(fruit, { uid: admin.id, role: admin.role });
      if (editingFruit?.id === fruit.id) setEditingFruit(null);
    } catch (err) {
      console.error("deactivateFruit failed", err);
      setActionError("Couldn't deactivate this fruit. Please try again.");
    } finally {
      setDeactivatingId(null);
    }
  };

  if (loading || !authorized) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Fruits</h1>

      <div className={canWrite ? "grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]" : ""}>
        {canWrite && (
          <FruitForm
            editingFruit={editingFruit}
            existingFruits={fruits}
            onSaved={() => setEditingFruit(null)}
            onCancelEdit={() => setEditingFruit(null)}
          />
        )}

        <div>
          <div className="mb-4">
            <FruitsFilterBar filters={filters} onChange={handleFiltersChange} categories={categories} />
          </div>

          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}

          {fruitsLoading ? (
            <p className="text-sm text-muted-foreground">Loading fruits…</p>
          ) : error ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-berry">{error}</p>
          ) : activeFruits.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No fruits in the catalogue yet.{canWrite ? ' Use the form to add the first one.' : ""}
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {filteredFruits.length} of {activeFruits.length} fruits
              </p>
              <FruitsTable
                fruits={pagedFruits}
                onEdit={setEditingFruit}
                onDeactivate={handleDeactivate}
                editingFruitId={editingFruit?.id ?? null}
                deactivatingId={deactivatingId}
                canWrite={canWrite}
                canDeactivate={canDeactivate}
              />
              <FruitsPagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={filteredFruits.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
