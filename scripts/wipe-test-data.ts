/**
 * One-time pre-launch cleanup: removes test customers (Firestore doc +
 * the matching Firebase Auth user), test orders, login attempt
 * counters, resets the order-number counter, and removes the bogus
 * placeholder admin account from early seed testing (if it still
 * exists).
 *
 * Deliberately does NOT touch buildings or fruits — those get replaced
 * with real data separately (see scripts/seed.ts), not wiped blind.
 *
 * Usage:
 *   pnpm --filter scripts run wipe-test-data
 *
 * Requires the same scripts/.env as seed.ts.
 */
import "dotenv/config";
import { adminDb, adminAuth } from "@raheja/shared/server";

const PLACEHOLDER_ADMIN_EMAIL = "your-email@example.com";

async function wipeCollection(name: string): Promise<number> {
  const snap = await adminDb().collection(name).get();
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
  return snap.size;
}

async function wipeCustomersAndAuthUsers(): Promise<number> {
  const snap = await adminDb().collection("customers").get();

  for (const doc of snap.docs) {
    try {
      await adminAuth().deleteUser(doc.id);
    } catch (err) {
      // User may already be gone from Auth even though the Firestore
      // doc remains — don't let that stop the doc cleanup below.
      console.warn(`  Couldn't delete Auth user ${doc.id}:`, (err as Error).message);
    }
    await doc.ref.delete();
  }

  return snap.size;
}

async function removePlaceholderAdmin(): Promise<boolean> {
  try {
    const user = await adminAuth().getUserByEmail(PLACEHOLDER_ADMIN_EMAIL);
    await adminDb().collection("admins").doc(user.uid).delete();
    await adminAuth().deleteUser(user.uid);
    return true;
  } catch {
    return false; // doesn't exist — already cleaned up, or never created
  }
}

async function resetOrderCounter(): Promise<void> {
  await adminDb().collection("counters").doc("orders").delete();
}

async function main() {
  console.log("Raheja Fruits — pre-launch test data cleanup\n");

  const customerCount = await wipeCustomersAndAuthUsers();
  console.log(`✓ Removed ${customerCount} test customer(s) (Firestore + Auth)`);

  const orderCount = await wipeCollection("orders");
  console.log(`✓ Removed ${orderCount} test order(s)`);

  const attemptCount = await wipeCollection("loginAttempts");
  console.log(`✓ Removed ${attemptCount} login attempt record(s)`);

  await resetOrderCounter();
  console.log("✓ Reset order counter — next order starts fresh from your configured starting number");

  const removedPlaceholder = await removePlaceholderAdmin();
  console.log(
    removedPlaceholder
      ? `✓ Removed placeholder admin account (${PLACEHOLDER_ADMIN_EMAIL})`
      : `  Placeholder admin account not found (already clean, or never created) — nothing to do`
  );

  console.log("\nDone. Buildings and fruits were left untouched — replace those separately.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nCleanup failed:", err);
  process.exit(1);
});