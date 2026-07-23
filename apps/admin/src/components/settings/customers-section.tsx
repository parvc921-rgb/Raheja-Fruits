"use client";

import type { SectionProps } from "./store-section";

export function CustomersSection({ register }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Customers</h2>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("registrationEnabled")} />
          Enable new resident registration
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("customerApprovalRequired")} />
          Require admin approval for new registrations
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("allowProfileEditing")} />
          Allow customers to edit their own profile
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("allowMultipleAddresses")} />
          Allow customers to save multiple addresses
        </label>
      </div>
    </section>
  );
}
