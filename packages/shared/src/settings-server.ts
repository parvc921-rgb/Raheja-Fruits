import { adminDb } from "./firebase/admin";
import { DEFAULT_BUSINESS_SETTINGS } from "./types";
import type { BusinessSettings } from "./types";

/**
 * Server-only read of the settings/business singleton, with a fallback
 * to DEFAULT_BUSINESS_SETTINGS if nobody's saved it yet (brand-new
 * project) — mirrors the admin UI's own fallback in
 * apps/admin/src/lib/settings.ts, so server-side enforcement and the
 * admin's live view of "what's currently in effect" never disagree.
 *
 * Uses the Admin SDK, so this bypasses firestore.rules entirely (as
 * intended — this is for server code, not a customer-facing read; see
 * @raheja/shared's PublicBusinessSettings/toPublicBusinessSettings for
 * the customer-safe subset instead).
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const snap = await adminDb().collection("settings").doc("business").get();
  if (snap.exists) {
    return snap.data() as BusinessSettings;
  }
  return {
    ...DEFAULT_BUSINESS_SETTINGS,
    updatedAt: null,
    updatedBy: "",
  } as unknown as BusinessSettings;
}
