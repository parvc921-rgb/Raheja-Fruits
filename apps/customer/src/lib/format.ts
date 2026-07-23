// The shared `Timestamp` type alias is `string` for simplicity across
// server/client boundaries, but the Firestore client SDK actually hands
// back a Timestamp object (with a `.toDate()` method) when reading
// `onSnapshot`/`getDoc` data. This helper handles both shapes safely
// rather than assuming one.
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function formatOrderDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDeliveryDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
