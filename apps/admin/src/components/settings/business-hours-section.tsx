"use client";

import { Field, INPUT_CLASS, type SectionProps } from "./store-section";

export function BusinessHoursSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Business Hours</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Store open" error={errors.businessHours?.open?.message}>
          <input type="time" className={INPUT_CLASS} {...register("businessHours.open")} />
        </Field>
        <Field label="Store closed" error={errors.businessHours?.close?.message}>
          <input type="time" className={INPUT_CLASS} {...register("businessHours.close")} />
        </Field>
        <Field label="Order cutoff time" error={errors.cutOffTime?.message}>
          <input type="time" className={INPUT_CLASS} {...register("cutOffTime")} />
        </Field>
        <Field label="Delivery start time" error={errors.deliveryStartTime?.message}>
          <input type="time" className={INPUT_CLASS} {...register("deliveryStartTime")} />
        </Field>
        <Field label="Delivery end time" error={errors.deliveryEndTime?.message}>
          <input type="time" className={INPUT_CLASS} {...register("deliveryEndTime")} />
        </Field>
        <Field label="Store status" error={errors.storeStatus?.message}>
          <select className={INPUT_CLASS} {...register("storeStatus")}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Holiday message" error={errors.holidayMessage?.message} full>
          <input
            className={INPUT_CLASS}
            placeholder="e.g. Closed for Diwali, back on the 25th"
            {...register("holidayMessage")}
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("maintenanceMode")} />
          Maintenance mode (customers see a maintenance message instead of the catalogue)
        </label>
        <Field label="Maintenance message" error={errors.maintenanceMessage?.message}>
          <input className={INPUT_CLASS} {...register("maintenanceMessage")} />
        </Field>
      </div>
    </section>
  );
}
