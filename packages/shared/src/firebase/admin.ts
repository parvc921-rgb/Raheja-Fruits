import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Server-only. Never import this file from a Client Component.
// Expects FIREBASE_SERVICE_ACCOUNT_KEY (base64-encoded JSON) in env,
// set via GitHub Actions secret / Firebase Functions config in production,
// and a local .env.local (gitignored) during development.

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. See README for local dev setup."
    );
  }

  const serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminApp = getAdminApp;
export const adminDb = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
