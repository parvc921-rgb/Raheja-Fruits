"use client";

import type { SectionProps } from "./store-section";

export function NotificationsSection({ register }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Notifications</h2>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("enableNotifications")} />
          Enable notifications overall
        </label>
        <label className="flex items-center gap-2 pl-6 text-sm">
          <input type="checkbox" {...register("enableWhatsapp")} />
          WhatsApp
        </label>
        <label className="flex items-center gap-2 pl-6 text-sm">
          <input type="checkbox" {...register("enableEmail")} />
          Email
        </label>
        <label className="flex items-center gap-2 pl-6 text-sm">
          <input type="checkbox" {...register("enableSMS")} />
          SMS
        </label>
        <label className="flex items-center gap-2 pl-6 text-sm">
          <input type="checkbox" {...register("enablePushNotifications")} />
          Push notifications
        </label>
      </div>
    </section>
  );
}
