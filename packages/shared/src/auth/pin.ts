import bcrypt from "bcryptjs";

// Server-only. Never import from a Client Component or bundle into the
// browser — pulling bcryptjs into the client would also tempt someone
// into comparing PINs client-side, which defeats the point.
//
// bcryptjs (pure JS, no native bindings) is used instead of argon2 so it
// runs without extra build config in the Cloud Functions Node runtime.
// Cost factor 12 is a reasonable balance of security vs. callable
// function latency for a 4-6 digit PIN space.

const SALT_ROUNDS = 12;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPinHash(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
