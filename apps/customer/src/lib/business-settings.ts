"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_PUBLIC_BUSINESS_SETTINGS } from "@raheja/shared";
import type { PublicBusinessSettings } from "@raheja/shared";

interface UsePublicBusinessSettingsResult {
  settings: PublicBusinessSettings;
  loading: boolean;
}

/**
 * Real-time listener on settings/public — the customer-safe mirror of
 * the admin's Business Settings (see PublicBusinessSettings in
 * @raheja/shared and apps/admin/src/lib/settings.ts, which writes this
 * doc). Always returns a real value, defaulting to
 * DEFAULT_PUBLIC_BUSINESS_SETTINGS before the doc has loaded (or if it
 * doesn't exist yet) so callers never have to null-check — worst case
 * a page briefly shows the shipped defaults for a moment before the
 * real live values arrive.
 */
export function usePublicBusinessSettings(): UsePublicBusinessSettingsResult {
  const [settings, setSettings] = useState<PublicBusinessSettings>(
    DEFAULT_PUBLIC_BUSINESS_SETTINGS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "settings", "public");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          // Merge over the defaults rather than replacing outright —
          // a settings/public doc saved before a new field existed
          // (e.g. businessHours, added after this doc was first
          // written) would otherwise leave that field undefined and
          // crash anything that reads it. This way a stale/partial
          // doc degrades to sensible defaults for whatever it's
          // missing, instead of blowing up the page.
          setSettings({
            ...DEFAULT_PUBLIC_BUSINESS_SETTINGS,
            ...(snap.data() as Partial<PublicBusinessSettings>),
          });
        }
        // If it doesn't exist yet, keep the defaults already in state —
        // nothing to do.
        setLoading(false);
      },
      (err) => {
        console.error("usePublicBusinessSettings subscription failed", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { settings, loading };
}
