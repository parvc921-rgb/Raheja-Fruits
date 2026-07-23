import { initializeApp } from "firebase-admin/app";

initializeApp();

// registerCustomer, verifyPin — the full mobile+PIN auth flow.
// Registration is direct (no invite step) — see functions/src/auth.ts
// and architecture doc §5.1 / §6.1.
export { registerCustomer, verifyPin } from "./auth";

// upsertFruit, toggleFruitAvailability, deleteFruit — fruit catalogue
// management. See functions/src/fruits.ts and architecture doc §7.4.
export { upsertFruit, toggleFruitAvailability, deleteFruit } from "./fruits";

// setCustomerStatus, updateCustomerAddress — Residents page account
// management. See functions/src/customers.ts and architecture doc §7.2.
export { setCustomerStatus, updateCustomerAddress } from "./customers";

// onOrderCreated — sends the WhatsApp order confirmation. See
// functions/src/notifications.ts and architecture doc §6.5.
export { onOrderCreated } from "./notifications";

// updateOrderStatus — the Packing List page's status transitions
// (placed -> packed -> out_for_delivery -> delivered/undelivered). See
// functions/src/orders.ts and architecture doc §7.7.
export { updateOrderStatus } from "./orders";

/**
 * onFruitOrCustomerMutation — could alternatively be implemented as
 * shared server-side helper functions called directly from admin Server
 * Actions rather than Firestore triggers, to keep audit writes
 * transactional with the mutation itself. Documented here as the
 * trigger-based alternative. See §7.4 / §4.6.
 */
// export const auditFruitChanges = onDocumentWritten("fruits/{fruitId}", ...)

/**
 * Procurement/packing-list Excel export was implemented client-side
 * instead (apps/admin/src/lib/excel-export.ts, using exceljs in the
 * browser) since the aggregation itself already happens client-side —
 * no separate Cloud Function needed for that one. See §7.6 / §7.8.
 */
