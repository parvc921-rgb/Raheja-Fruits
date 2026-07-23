"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import {
  createBuilding,
  isDuplicateBuildingName,
  newBuildingId,
  updateBuildingName,
} from "@/lib/building-mutations";
import { WingManager } from "@/components/buildings/wing-manager";
import type { Building } from "@raheja/shared";

const formSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80, "Keep it under 80 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface BuildingFormProps {
  editingBuilding: Building | null;
  existingBuildings: Building[];
  canDeactivateWings: boolean;
  onSaved: () => void;
  onCancelEdit: () => void;
}

// Reusable for both create and edit, same as FruitForm. Wing management
// only makes sense once a building exists (a wing needs a buildingId to
// attach to), so the WingManager section only shows up while editing —
// creating a building just gets you the name field, and you come back
// via Edit to add its wings right after.
export function BuildingForm({
  editingBuilding,
  existingBuildings,
  canDeactivateWings,
  onSaved,
  onCancelEdit,
}: BuildingFormProps) {
  const { admin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    reset({ name: editingBuilding?.name ?? "" });
    setServerError(null);
  }, [editingBuilding, reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    if (isDuplicateBuildingName(values.name, existingBuildings, editingBuilding?.id)) {
      setError("name", { message: "A building with this name already exists." });
      return;
    }

    if (!admin) {
      setServerError("Your session expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const actor = { uid: admin.id, role: admin.role };
      const name = values.name.trim();

      if (editingBuilding) {
        await updateBuildingName(editingBuilding, name, actor);
      } else {
        const buildingId = newBuildingId();
        await createBuilding(buildingId, name, actor);
      }

      onSaved();
    } catch (err) {
      console.error("Building save failed", err);
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">
        {editingBuilding ? `Edit ${editingBuilding.name}` : "New building"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Building name
          </label>
          <input
            id="name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Saving…" : editingBuilding ? "Save changes" : "Add building"}
          </button>
          {editingBuilding && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Done
            </button>
          )}
        </div>
      </form>

      {editingBuilding && (
        <div className="mt-4 border-t border-border pt-4">
          <WingManager buildingId={editingBuilding.id} canDeactivate={canDeactivateWings} />
        </div>
      )}
    </div>
  );
}
