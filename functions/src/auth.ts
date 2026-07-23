import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import {
  registerCustomerSchema,
  verifyPinSchema,
  isLockedOut,
  nextStateAfterFailure,
  stateAfterSuccess,
  type RegisterCustomerResult,
  type VerifyPinResult,
  type Building,
  type Customer,
} from "@raheja/shared";
import { hashPin, verifyPinHash, getBusinessSettings } from "@raheja/shared/server";

const db = () => getFirestore();

/**
 * registerCustomer — direct registration, no invite step. Must be
 * called while signed in with the Firebase Auth user created by the
 * client-side phone OTP flow (request.auth.uid + the phone_number
 * claim on the ID token). Validates the selected building/wing against
 * Firestore the same way createInvite used to, refuses to overwrite an
 * already-registered number, hashes the PIN, and creates the
 * `customers` doc. See architecture doc §5.1 / §6.1.
 */
export const registerCustomer = onCall<unknown, Promise<RegisterCustomerResult>>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Verify your phone number first.");
    }

    const parsed = registerCustomerSchema.safeParse(request.data);
    if (!parsed.success) {
      return { ok: false, error: "Please check the form and try again." };
    }

    const uid = request.auth.uid;
    const authedPhone = request.auth.token.phone_number as string | undefined;
    if (!authedPhone) {
      throw new HttpsError(
        "failed-precondition",
        "Phone verification did not complete correctly."
      );
    }

    const { name, buildingId, wing, flatNumber, pin } = parsed.data;

    const settings = await getBusinessSettings();
    if (!settings.registrationEnabled) {
      return { ok: false, error: "Registration is currently closed. Please check back later." };
    }

    try {
      // Someone who already has a customer doc (already registered, or
      // re-verified the same number) shouldn't silently overwrite it —
      // send them to log in instead.
      const existing = await db().collection("customers").doc(uid).get();
      if (existing.exists) {
        return { ok: false, error: "This number is already registered. Please log in instead." };
      }

      const buildingSnap = await db().collection("buildings").doc(buildingId).get();
      if (!buildingSnap.exists) {
        return { ok: false, error: "Selected building not found." };
      }
      const building = buildingSnap.data() as Building;

      // Wings live in a subcollection (buildings/{buildingId}/wings),
      // not an array field on the building doc — see
      // apps/admin/src/lib/buildings.ts for the read-side equivalent.
      const wingSnap = await db()
        .collection("buildings")
        .doc(buildingId)
        .collection("wings")
        .where("name", "==", wing)
        .where("active", "==", true)
        .limit(1)
        .get();
      if (wingSnap.empty) {
        return { ok: false, error: `Wing "${wing}" isn't part of ${building.name}.` };
      }

      const pinHash = await hashPin(pin);
      const address = `${building.name}, Wing ${wing}, Flat ${flatNumber}`;
      const needsApproval = settings.customerApprovalRequired;

      const customer: Omit<Customer, "id"> = {
        phone: authedPhone,
        name,
        pinHash,
        buildingId,
        buildingName: building.name,
        wing,
        flatNumber,
        address,
        status: needsApproval ? "pending" : "active",
        createdAt: FieldValue.serverTimestamp() as unknown as string,
        lastOrderAt: null,
      };

      await db().collection("customers").doc(uid).set(customer);

      return { ok: true, pendingApproval: needsApproval };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("registerCustomer failed", err);
      return { ok: false, error: "Something went wrong completing your registration." };
    }
  }
);

/**
 * verifyPin — the return-login path. Verifies phone + PIN against the
 * hashed PIN on the customer's `customers` doc, applies a lockout policy
 * (see @raheja/shared/auth/lockout) tracked in a separate
 * `loginAttempts` collection, and on success mints a Firebase custom
 * token for the client to sign in with. See §5.1.
 */
export const verifyPin = onCall<unknown, Promise<VerifyPinResult>>(async (request) => {
  const parsed = verifyPinSchema.safeParse(request.data);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid mobile number and PIN." };
  }
  const { phone, pin } = parsed.data;

  const customerSnap = await db()
    .collection("customers")
    .where("phone", "==", phone)
    .limit(1)
    .get();

  if (customerSnap.empty) {
    // Deliberately vague — don't reveal whether the phone number is
    // registered.
    return { ok: false, error: "Incorrect mobile number or PIN." };
  }

  const customerDoc = customerSnap.docs[0];
  const customer = customerDoc.data() as Customer;

  if (customer.status === "pending") {
    return { ok: false, error: "Your account is awaiting admin approval. Please check back soon." };
  }

  if (customer.status !== "active") {
    return { ok: false, error: "This account is not active. Contact Raheja Fruits support." };
  }

  const attemptsRef = db().collection("loginAttempts").doc(customerDoc.id);
  const now = Date.now();

  const result = await db().runTransaction(async (tx) => {
    const attemptsSnap = await tx.get(attemptsRef);
    const state = attemptsSnap.exists
      ? (attemptsSnap.data() as { failedAttempts: number; lockedUntil: number | null })
      : { failedAttempts: 0, lockedUntil: null };

    if (isLockedOut(state, now)) {
      return { locked: true, lockedUntil: state.lockedUntil! };
    }

    const isValid = await verifyPinHash(pin, customer.pinHash);

    if (!isValid) {
      const nextState = nextStateAfterFailure(state, now);
      tx.set(attemptsRef, nextState, { merge: true });
      return { locked: false, valid: false };
    }

    tx.set(attemptsRef, stateAfterSuccess(), { merge: true });
    return { locked: false, valid: true };
  });

  if (result.locked) {
    return {
      ok: false,
      error: "Too many incorrect attempts. Try again in 15 minutes.",
      lockedUntil: result.lockedUntil,
    };
  }

  if (!result.valid) {
    return { ok: false, error: "Incorrect mobile number or PIN." };
  }

  const customToken = await getAuth().createCustomToken(customerDoc.id);
  return { ok: true, customToken };
});
