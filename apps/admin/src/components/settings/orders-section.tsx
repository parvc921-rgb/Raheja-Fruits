"use client";

import { Field, INPUT_CLASS, type SectionProps } from "./store-section";

export function OrdersSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Orders</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Minimum order amount (₹)" error={errors.minimumOrder?.message}>
          <input type="number" step="1" className={INPUT_CLASS} {...register("minimumOrder")} />
        </Field>
        <Field label="Delivery charge (₹)" error={errors.deliveryCharge?.message}>
          <input type="number" step="1" className={INPUT_CLASS} {...register("deliveryCharge")} />
        </Field>
        <Field label="Free delivery above (₹)" error={errors.freeDeliveryAbove?.message}>
          <input
            type="number"
            step="1"
            className={INPUT_CLASS}
            {...register("freeDeliveryAbove")}
          />
        </Field>
        <Field label="Max orders per day" error={errors.maxOrdersPerDay?.message}>
          <input type="number" step="1" className={INPUT_CLASS} {...register("maxOrdersPerDay")} />
          <p className="text-xs text-muted-foreground">0 = unlimited</p>
        </Field>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("acceptOrders")} />
          Accept orders
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("allowOutOfStockOrders")} />
          Allow ordering out-of-stock fruits
        </label>
      </div>
    </section>
  );
}
