"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { BusinessSettingsInput } from "@raheja/shared";

export interface SectionProps {
  register: UseFormRegister<BusinessSettingsInput>;
  errors: FieldErrors<BusinessSettingsInput>;
}

export const INPUT_CLASS = "rounded-md border border-border bg-background px-3 py-2 text-sm";

export function StoreSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Store</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Store name" error={errors.storeName?.message}>
          <input className={INPUT_CLASS} {...register("storeName")} />
        </Field>
        <Field label="Currency" error={errors.currency?.message}>
          <input className={INPUT_CLASS} {...register("currency")} />
        </Field>
        <Field label="Store tagline" error={errors.storeTagline?.message} full>
          <input className={INPUT_CLASS} {...register("storeTagline")} />
        </Field>
        <Field label="Support phone" error={errors.supportPhone?.message}>
          <input className={INPUT_CLASS} placeholder="+91…" {...register("supportPhone")} />
        </Field>
        <Field label="Support WhatsApp" error={errors.supportWhatsapp?.message}>
          <input className={INPUT_CLASS} placeholder="+91…" {...register("supportWhatsapp")} />
        </Field>
        <Field label="Support email" error={errors.supportEmail?.message} full>
          <input type="email" className={INPUT_CLASS} {...register("supportEmail")} />
        </Field>
      </div>
    </section>
  );
}

// Shared by every section component below — a labeled field wrapper
// with error text, so each section only has to describe its own inputs.
export function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
