"use client";

import { useRequireAdminAuth } from "@/hooks/use-require-admin-auth";
import { useBusinessSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings/settings-form";

// super_admin only — every other role gets redirected (see
// useRequireAdminAuth) before ever seeing this page, and firestore.rules
// additionally blocks the read/write server-side regardless of what the
// client does, so this isn't just a UI-level restriction.
export default function BusinessSettingsPage() {
  const { loading, authorized } = useRequireAdminAuth(["super_admin"]);
  const { settings, loading: settingsLoading, error } = useBusinessSettings();

  if (loading || !authorized) return null;

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold">Business Settings</h1>

      {settingsLoading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : error ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-berry">
          {error}
        </p>
      ) : settings ? (
        <SettingsForm settings={settings} />
      ) : null}
    </div>
  );
}
