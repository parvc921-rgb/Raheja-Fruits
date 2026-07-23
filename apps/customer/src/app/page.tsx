"use client";

import Link from "next/link";
import { usePublicBusinessSettings } from "@/lib/business-settings";

// TODO: check auth state server-side and redirect straight to /catalogue
// for logged-in customers. This stub is the pre-auth landing screen.

export default function HomePage() {
  const { settings } = usePublicBusinessSettings();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      {settings.homepageBannerEnabled && settings.homepageBanner && (
        <div
          className="w-full rounded-md px-4 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: settings.homepageBannerColor }}
        >
          {settings.homepageBanner}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-semibold">{settings.storeName}</h1>
        <p className="text-muted-foreground">{settings.storeTagline}</p>
      </div>

      {settings.maintenanceMode ? (
        <div className="w-full rounded-md border border-border bg-card p-4">
          <p className="text-sm font-medium">We&apos;ll be right back</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {settings.maintenanceMessage || "We're temporarily unavailable. Please check back shortly."}
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm font-medium text-primary underline"
          >
            Log in to view past orders
          </Link>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-3 text-primary-foreground"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-border px-4 py-3 text-center font-medium"
          >
            Create an account
          </Link>
        </div>
      )}

      {settings.holidayMessage && !settings.maintenanceMode && (
        <p className="text-sm text-muted-foreground">{settings.holidayMessage}</p>
      )}
    </main>
  );
}
