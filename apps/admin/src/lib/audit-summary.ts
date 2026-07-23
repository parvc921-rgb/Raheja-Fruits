// Known actions get a friendly label; anything logged in the future
// that isn't in this map still renders reasonably via the fallback
// (underscores -> spaces, capitalized) rather than looking broken.
const ACTION_LABELS: Record<string, string> = {
  invite_created: "Invite created",
  invite_revoked: "Invite revoked",
  fruit_created: "Fruit created",
  fruit_updated: "Fruit updated",
  fruit_availability_toggled: "Availability toggled",
  fruit_deleted: "Fruit deleted",
  fruit_deactivated: "Fruit deactivated",
  customer_status_changed: "Customer status changed",
  customer_address_updated: "Resident address updated",
  building_created: "Building created",
  building_updated: "Building updated",
  building_deactivated: "Building deactivated",
  wing_created: "Wing added",
  wing_deactivated: "Wing retired",
  settings_updated: "Business settings updated",
  order_status_changed: "Order status changed",
};

export function formatAction(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// A generic key-diff summary that works across every action type
// without hardcoding formatting per action — new mutations added later
// get a reasonable summary for free as long as they call writeAuditLog
// with before/after objects.
export function summarizeChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): string {
  if (!before && after) return "Created";
  if (before && !after) return "Deleted";
  if (!before || !after) return "—";

  const changedKeys = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );

  if (changedKeys.length === 0) return "No field changes";

  return changedKeys
    .map((key) => `${key}: ${formatValue(before[key])} → ${formatValue(after[key])}`)
    .join(", ");
}
