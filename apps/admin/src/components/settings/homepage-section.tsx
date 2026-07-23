"use client";

import { Field, INPUT_CLASS, type SectionProps } from "./store-section";

export function HomepageSection({ register, errors }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Homepage</h2>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("homepageBannerEnabled")} />
        Show homepage banner
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Banner text" error={errors.homepageBanner?.message} full>
          <input className={INPUT_CLASS} {...register("homepageBanner")} />
        </Field>
        <Field label="Banner color" error={errors.homepageBannerColor?.message}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 rounded-md border border-border"
              {...register("homepageBannerColor")}
            />
            <input className={INPUT_CLASS} {...register("homepageBannerColor")} />
          </div>
        </Field>
      </div>
    </section>
  );
}
