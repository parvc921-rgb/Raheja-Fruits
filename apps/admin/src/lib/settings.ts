"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { writeAuditLog } from "@/lib/audit-log";
import { DEFAULT_BUSINESS_SETTINGS, toPublicBusinessSettings } from "@raheja/shared";
import type { AdminRole, BusinessSettings } from "@raheja/shared";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "business";
const PUBLIC_SETTINGS_DOC_ID = "public";

interface UseBusinessSettingsResult {
  settings: BusinessSettings | null;
  loading: boolean;
  error: string | null;
}

/**
 * Real-time listener on the single settings/business document. If the
 * doc doesn't exist yet (brand-new project, nobody's saved settings
 * before), surfaces DEFAULT_BUSINESS_SETTINGS instead of null so the
 * form always has something sensible to show — the doc only actually
 * gets created the first time someone clicks Save.
 */
export function useBusinessSettings(): UseBusinessSettingsResult {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as BusinessSettings);
        } else {
          setSettings({
            ...DEFAULT_BUSINESS_SETTINGS,
            updatedAt: null,
            updatedBy: "",
          } as unknown as BusinessSettings);
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("useBusinessSettings subscription failed", err);
        setError("Couldn't load business settings. Please refresh the page.");
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { settings, loading, error };
}

export interface SettingsActor {
  uid: string;
  role: AdminRole;
}

/**
 * Overwrites the whole settings/business doc with the given values (the
 * form always submits the complete set, never a partial patch — there's
 * only one doc, so there's no risk of clobbering someone else's
 * unrelated field the way there would be for a list of many documents).
 */
export async function saveBusinessSettings(
  values: Omit<BusinessSettings, "updatedAt" | "updatedBy">,
  before: BusinessSettings | null,
  actor: SettingsActor
): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const publicRef = doc(db, SETTINGS_COLLECTION, PUBLIC_SETTINGS_DOC_ID);

  // Both docs are written together in one batch — settings/public (what
  // the customer app reads) can never end up stale relative to
  // settings/business (what this form reads), even if the save fails
  // partway through.
  const batch = writeBatch(db);
  batch.set(ref, {
    ...values,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });
  batch.set(publicRef, toPublicBusinessSettings(values));
  await batch.commit();

  // Firestore rejects `undefined` field values outright, so the
  // before/after audit snapshots must actually omit updatedAt/updatedBy
  // rather than set them to undefined — this is exactly what broke the
  // very first save (no existing doc yet, so `before` came from the
  // synthesized default object, whose updatedAt was already undefined).
  const beforeForAudit = before
    ? (() => {
        const { updatedAt: _updatedAt, updatedBy: _updatedBy, ...rest } = before;
        return rest;
      })()
    : null;

  await writeAuditLog({
    actorId: actor.uid,
    actorRole: actor.role,
    action: "settings_updated",
    targetType: "settings",
    targetId: SETTINGS_DOC_ID,
    before: beforeForAudit,
    after: { ...values },
  });
}
