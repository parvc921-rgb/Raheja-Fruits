"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { uploadFruitImage } from "@/lib/image-upload";
import {
  createFruit,
  isDuplicateFruitName,
  newFruitId,
  updateFruit,
  type FruitFormFields,
} from "@/lib/fruit-mutations";
import type { Fruit } from "@raheja/shared";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Required").max(60, "Keep it under 60 characters"),
    unit: z.enum(["kg", "dozen", "piece", "box"]),
    category: z.string().trim().optional(),
    retailPrice: z.coerce.number().positive("Must be positive"),
    memberPrice: z.coerce.number().positive("Must be positive"),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((d) => d.memberPrice <= d.retailPrice, {
    message: "Can't exceed retail price",
    path: ["memberPrice"],
  });

type FormValues = z.infer<typeof formSchema>;

interface FruitFormProps {
  editingFruit: Fruit | null;
  existingFruits: Fruit[];
  onSaved: () => void;
  onCancelEdit: () => void;
}

// Reusable for both create and edit — which mode it's in is entirely
// determined by whether `editingFruit` is set. Milestone 2: writes
// Firestore directly (createFruit/updateFruit in lib/fruit-mutations.ts)
// rather than going through a Cloud Function, uploads the photo to
// Storage first if one was picked, blocks case-insensitive duplicate
// names client-side, and lets the real-time listener on the listing
// page (hooks/use-fruits.ts) pick up the change — no local refetch here.
export function FruitForm({ editingFruit, existingFruits, onSaved, onCancelEdit }: FruitFormProps) {
  const { admin } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    defaultValues: { name: "", unit: "kg", category: "", retailPrice: 0, memberPrice: 0, sortOrder: 0 },
  });

  useEffect(() => {
    if (editingFruit) {
      reset({
        name: editingFruit.name,
        unit: editingFruit.unit as FormValues["unit"],
        category: editingFruit.category ?? "",
        retailPrice: editingFruit.retailPrice,
        memberPrice: editingFruit.memberPrice,
        sortOrder: editingFruit.sortOrder,
      });
      setImagePreview(editingFruit.imageUrl || null);
      setImageFile(null);
    } else {
      reset({ name: "", unit: "kg", category: "", retailPrice: 0, memberPrice: 0, sortOrder: 0 });
      setImagePreview(null);
      setImageFile(null);
    }
    setServerError(null);
  }, [editingFruit, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    if (isDuplicateFruitName(values.name, existingFruits, editingFruit?.id)) {
      setError("name", { message: "A fruit with this name already exists." });
      return;
    }

    if (!imageFile && !editingFruit?.imageUrl) {
      setServerError("Please add a photo.");
      return;
    }

    if (!admin) {
      setServerError("Your session expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const fruitId = editingFruit?.id ?? newFruitId();

      let imageUrl = editingFruit?.imageUrl ?? "";
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadFruitImage(imageFile, fruitId);
        setUploading(false);
      }

      const fields: FruitFormFields = {
        name: values.name.trim(),
        unit: values.unit,
        category: values.category?.trim() || null,
        retailPrice: values.retailPrice,
        memberPrice: values.memberPrice,
        sortOrder: values.sortOrder,
        imageUrl,
      };

      const actor = { uid: admin.id, role: admin.role };

      if (editingFruit) {
        await updateFruit(
          fruitId,
          fields,
          {
            name: editingFruit.name,
            unit: editingFruit.unit,
            category: editingFruit.category,
            retailPrice: editingFruit.retailPrice,
            memberPrice: editingFruit.memberPrice,
            sortOrder: editingFruit.sortOrder,
            imageUrl: editingFruit.imageUrl,
          },
          actor
        );
      } else {
        await createFruit(fruitId, fields, actor);
      }

      onSaved();
    } catch (err) {
      console.error("Fruit save failed", err);
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const busy = submitting || uploading;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">
        {editingFruit ? `Edit ${editingFruit.name}` : "New fruit"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview of a locally-picked/uploaded file, next/image isn't needed here
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="image" className="text-sm font-medium">
              Photo
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="unit" className="text-sm font-medium">
              Unit
            </label>
            <select
              id="unit"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("unit")}
            >
              <option value="kg">kg</option>
              <option value="dozen">dozen</option>
              <option value="piece">piece</option>
              <option value="box">box</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="category"
              placeholder="e.g. Citrus"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("category")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="retailPrice" className="text-sm font-medium">
              Retail price (₹)
            </label>
            <input
              id="retailPrice"
              type="number"
              step="0.5"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("retailPrice")}
            />
            {errors.retailPrice && (
              <p className="text-sm text-red-600">{errors.retailPrice.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="memberPrice" className="text-sm font-medium">
              Member price (₹)
            </label>
            <input
              id="memberPrice"
              type="number"
              step="0.5"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("memberPrice")}
            />
            {errors.memberPrice && (
              <p className="text-sm text-red-600">{errors.memberPrice.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sortOrder" className="text-sm font-medium">
            Sort order
          </label>
          <input
            id="sortOrder"
            type="number"
            className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("sortOrder")}
          />
          <p className="text-xs text-muted-foreground">Lower numbers show first in the catalogue.</p>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="mt-1 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {uploading ? "Uploading photo…" : submitting ? "Saving…" : editingFruit ? "Save changes" : "Add fruit"}
          </button>
          {editingFruit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
