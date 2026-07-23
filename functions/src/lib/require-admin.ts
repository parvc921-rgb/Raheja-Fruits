import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import type { Admin, AdminRole } from "@raheja/shared";

// Every admin-facing callable should call this first. It's the
// server-side counterpart to the client's useRequireAdminAuth hook —
// that hook is a UX redirect, this is the actual enforcement, since a
// Cloud Function runs with the Admin SDK and bypasses Firestore
// Security Rules entirely.
export async function requireAdmin(
  request: CallableRequest,
  allowedRoles: AdminRole[]
): Promise<{ uid: string; admin: Admin }> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in as an admin first.");
  }

  const uid = request.auth.uid;
  const snap = await getFirestore().collection("admins").doc(uid).get();

  if (!snap.exists) {
    throw new HttpsError("permission-denied", "No admin account found for this user.");
  }

  const admin = { id: snap.id, ...snap.data() } as Admin;

  if (!admin.isActive) {
    throw new HttpsError("permission-denied", "This admin account is not active.");
  }

  if (!allowedRoles.includes(admin.role)) {
    throw new HttpsError("permission-denied", "You don't have permission to do this.");
  }

  return { uid, admin };
}
