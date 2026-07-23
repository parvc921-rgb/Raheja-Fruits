/**
 * Seeds the Firestore data this scaffold needs to be testable end to
 * end: buildings (required before any resident can register, since
 * every customer references one) and a starter fruit catalogue.
 * Optionally bootstraps the very first super_admin account too, since
 * there's no self-registration path for admins (see README's admin
 * auth section for why).
 *
 * Usage:
 *   pnpm seed
 *
 * Requires a scripts/.env (gitignored, copy from scripts/.env.example)
 * with FIREBASE_SERVICE_ACCOUNT_KEY set — same base64-encoded service
 * account JSON used by the Next.js apps' Server Actions.
 *
 * Idempotent: buildings and fruits use deterministic doc IDs (slugs)
 * and `set(..., { merge: true })`, so re-running this script updates
 * existing docs in place rather than creating duplicates.
 */
import "dotenv/config";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@raheja/shared/server";
import { SEED_BUILDINGS } from "./data/buildings";
import { SEED_FRUITS } from "./data/fruits";

async function seedBuildings() {
  const db = adminDb();
  console.log(`\nSeeding ${SEED_BUILDINGS.length} buildings...`);

  for (const building of SEED_BUILDINGS) {
    await db
      .collection("buildings")
      .doc(building.slug)
      .set(
        {
          name: building.name,
          wings: building.wings,
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    console.log(`  ✓ ${building.name} (${building.wings.length} wings)`);
  }
}

async function seedFruits() {
  const db = adminDb();
  console.log(`\nSeeding ${SEED_FRUITS.length} fruits...`);

  for (const fruit of SEED_FRUITS) {
    await db
      .collection("fruits")
      .doc(fruit.slug)
      .set(
        {
          name: fruit.name,
          unit: fruit.unit,
          category: fruit.category,
          imageUrl: "",
          retailPrice: fruit.retailPrice,
          memberPrice: fruit.memberPrice,
          sortOrder: fruit.sortOrder,
          isAvailable: true,
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: "seed-script",
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "seed-script",
        },
        { merge: true }
      );
    console.log(`  ✓ ${fruit.name} (₹${fruit.retailPrice} → ₹${fruit.memberPrice})`);
  }
}

async function bootstrapSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "\nSkipping admin bootstrap (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to enable)."
    );
    return;
  }

  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";
  const phone = process.env.SEED_ADMIN_PHONE ?? "";

  console.log(`\nBootstrapping super_admin account for ${email}...`);

  const auth = adminAuth();
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  Found existing Firebase Auth user (${uid}), reusing it.`);
  } catch {
    const created = await auth.createUser({ email, password, displayName: name });
    uid = created.uid;
    console.log(`  Created new Firebase Auth user (${uid}).`);
  }

  await adminDb()
    .collection("admins")
    .doc(uid)
    .set(
      {
        name,
        phone,
        role: "super_admin",
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log(`  ✓ admins/${uid} set to role: super_admin, isActive: true`);
  console.log(`  Sign in at the admin app with ${email} / (the password you set).`);
}

async function main() {
  console.log("Raheja Fruits — seed script");

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error(
      "\nFIREBASE_SERVICE_ACCOUNT_KEY is not set. Copy scripts/.env.example to scripts/.env and fill it in."
    );
    process.exit(1);
  }

  await seedBuildings();
  await seedFruits();
  await bootstrapSuperAdmin();

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nSeed script failed:", err);
  process.exit(1);
});
