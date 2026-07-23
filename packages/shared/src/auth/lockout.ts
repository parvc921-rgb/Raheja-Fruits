// Pure policy logic for PIN login lockout, kept separate from the
// Firestore read/write plumbing so it's easy to unit test and reason
// about. The actual `failedAttempts` / `lockedUntil` fields live in a
// `loginAttempts/{customerId}` doc (see functions/src/auth.ts), not on
// the public-readable `customers` doc.

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LoginAttemptState {
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
}

export function isLockedOut(state: LoginAttemptState, now: number): boolean {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

export function nextStateAfterFailure(
  state: LoginAttemptState,
  now: number
): LoginAttemptState {
  const failedAttempts = state.failedAttempts + 1;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return { failedAttempts: 0, lockedUntil: now + LOCKOUT_DURATION_MS };
  }
  return { failedAttempts, lockedUntil: state.lockedUntil };
}

export function stateAfterSuccess(): LoginAttemptState {
  return { failedAttempts: 0, lockedUntil: null };
}
