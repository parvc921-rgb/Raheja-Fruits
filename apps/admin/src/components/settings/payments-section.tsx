"use client";

import { Field, INPUT_CLASS, type SectionProps } from "./store-section";

export function PaymentsSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Payments</h2>
      <Field label="Payment mode" error={errors.paymentMode?.message}>
        <select className={INPUT_CLASS} {...register("paymentMode")}>
          <option value="cod">Cash on Delivery</option>
          <option value="online">Online Payment</option>
          <option value="both">Both</option>
        </select>
      </Field>
    </section>
  );
}
