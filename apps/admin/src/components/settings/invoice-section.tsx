"use client";

import { Field, INPUT_CLASS, type SectionProps } from "./store-section";

export function InvoiceSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Invoices</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Invoice prefix" error={errors.invoicePrefix?.message}>
          <input className={INPUT_CLASS} placeholder="e.g. RF" {...register("invoicePrefix")} />
        </Field>
        <Field label="Invoice starting number" error={errors.invoiceStartingNumber?.message}>
          <input
            type="number"
            step="1"
            className={INPUT_CLASS}
            placeholder="e.g. 10001"
            {...register("invoiceStartingNumber")}
          />
        </Field>
        <Field label="GST number" error={errors.gstNumber?.message} full>
          <input className={INPUT_CLASS} {...register("gstNumber")} />
        </Field>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("showWholesalePrices")} />
        Show wholesale prices (procurement view)
      </label>
    </section>
  );
}
