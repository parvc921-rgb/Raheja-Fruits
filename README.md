# Raheja Fruits

Fresh Fruits at Member Prices — invite-only grocery ordering for Raheja Estate residents.

Two apps, one Firebase backend. See `/docs/raheja-fruits-architecture.md` for the full technical
architecture document (data model, auth flow, business rules, deployment).

**Every feature in the architecture doc is now implemented** — both apps, all Cloud Functions, and
the seed script. The `## Status` section below is a running build log (newest first) covering what
was built, the reasoning behind non-obvious decisions, and a couple of real bugs caught and fixed
along the way (a `firebase-admin`-in-the-browser bundling bug, and a Firestore rules gap that
would've let admin writes bypass the audit log). Worth reading before extending this further.

**Not yet done, and worth doing before this goes live**: a real end-to-end run against a live
Firebase project (this was all built and verified in a sandbox without registry/network access —
see the verification notes throughout `## Status` for exactly what was and wasn't checked), the
real approved Raheja Estate building list in place of the placeholder seed data, real fruit photos,
and the WhatsApp template's Meta review (see that section below).

## Structure

```
apps/
  customer/     -> app.rahejafruits.in   (Next.js 15 PWA, invite-only ordering)
  admin/        -> admin.rahejafruits.in (Next.js 15, ops dashboard)
packages/
  shared/       -> shared Zod schemas, TypeScript types, Firebase Admin helpers
functions/      -> Cloud Functions (PIN auth, WhatsApp send, Excel export, audit triggers)
```

## Getting started

This repo uses **pnpm workspaces**. You'll need Node 20+, pnpm 9+, and the Firebase CLI installed
locally (not available in this scaffold environment, so run these yourself):

```bash
pnpm install
cp apps/customer/.env.example apps/customer/.env.local
cp apps/admin/.env.example apps/admin/.env.local
# fill in Firebase project config in both .env.local files

pnpm dev:customer   # runs on localhost:3000
pnpm dev:admin      # runs on localhost:3001
```

### Firebase

```bash
firebase login
firebase use --add          # select/create your Firebase project
firebase emulators:start    # local Firestore + Auth emulators for development
```

Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

## Status

**Audit Log viewer implemented — this closes out the full feature list from the architecture doc.**
- `lib/audit-log.ts` — real-time subscription to the most recent 200 `auditLog` entries
- `lib/admins.ts` — lists all admin accounts, used to resolve `actorId` → name and to populate the
  actor filter dropdown
- `lib/audit-summary.ts` — the one piece of this worth calling out: a **generic** before/after
  diff summarizer (`summarizeChange`) that works across every action type already logged
  (`invite_created`, `fruit_updated`, `order_status_changed`, etc.) without hardcoding formatting
  per action. It diffs the two objects' keys and renders `field: old → new`. `formatAction` has a
  friendly-label map for known actions but falls back to a readable auto-format
  (`some_new_action` → "Some New Action") for anything logged in the future that isn't in the map
  yet — so adding a new admin mutation later doesn't require remembering to update this page too
- `app/(protected)/audit-log/page.tsx` — filterable by actor, action, target type, and date range,
  all applied client-side over the one subscription; each row expands to show the full before/after
  JSON for anyone who needs more than the one-line summary

**Seed script implemented** (`pnpm seed` from the repo root):
- `scripts/data/buildings.ts` — a placeholder Raheja Estate building list (5 buildings, 2-4 wings
  each) — replace with the real approved list before going live
- `scripts/data/fruits.ts` — a 12-item starter catalogue with realistic retail/member price gaps.
  Photos are intentionally left blank (`imageUrl: ""`) since Storage uploads need real image
  files; the catalogue UI already falls back to a text placeholder when it's empty — add real
  photos afterward via the admin app's Fruit Management screen
- `scripts/seed.ts` — idempotent: buildings and fruits use deterministic doc IDs (slugs) and
  `set(..., { merge: true })`, so re-running the script updates existing docs instead of creating
  duplicates. Also optionally bootstraps the very first `super_admin` account (creates the
  Firebase Auth user if needed, then sets the matching `admins/{uid}` doc) if
  `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` are set — this is the "create it manually" step from
  the admin auth section, automated
- Set up as its own pnpm workspace member (`scripts/package.json`) so `@raheja/shared/server`
  resolves correctly through the same `exports` map as `functions/`, rather than reaching for
  `firebase-admin` directly and duplicating the service-account bootstrap logic. One thing worth
  knowing if you're extending this script: it deliberately has no `"type": "module"` in its
  `package.json` (unlike a typical modern Node script) — with `moduleResolution: NodeNext`, ESM
  mode requires explicit `.js` extensions on relative imports (`./data/buildings.js` even though
  the source is `.ts`), which `tsx` doesn't care about but `tsc` enforces; staying CommonJS here
  sidesteps that entirely and matches how `functions/` is already set up
- Run it: `cp scripts/.env.example scripts/.env`, fill in `FIREBASE_SERVICE_ACCOUNT_KEY` (same
  value as the apps' `.env.local` files), then `pnpm seed`

**Packing List implemented**:
- `packages/shared/src/orders.ts` — `ORDER_STATUS_TRANSITIONS`, the single source of truth for
  which status transitions are legal (`placed → packed → out_for_delivery → delivered`, plus
  `undelivered` as a retry-able side branch and one-step undos for admin convenience). Both the
  Cloud Function's server-side validation and the UI's button rendering read from this exact same
  map, so the buttons shown can never drift from what the server will actually accept. Exported
  from the main barrel since it's pure logic with no `firebase-admin` dependency
- `functions/src/orders.ts` — `updateOrderStatus`, admin-only (`super_admin`/`operations`),
  rejects any transition not in the shared map regardless of what the client sends, and
  audit-logs every change. Tightened `firestore.rules` for `orders` update to `if false` in the
  process — it previously allowed admins to write order status directly, which would have bypassed
  both the transition validation and the audit log; now every status change goes through the
  callable, consistent with the invites/fruits/customers pattern
- `lib/packing-list.ts` — pure grouping: orders for the selected delivery date, grouped by
  building then wing, each sorted by flat number, so delivery staff can walk one building
  wing-by-wing instead of hunting through a flat list
- `lib/delivery-dates.ts` — the date-key helpers were pulled out of `lib/procurement.ts` (which
  now just re-exports them) since Packing List needed the exact same "group by delivery date"
  logic — avoided duplicating it a second time
- `app/(protected)/packing-list/page.tsx` — delivery-date selector (same pattern as Procurement),
  building/wing sections, per-order item checklists, and the status-transition buttons. `read_only`
  sees the same layout with the buttons hidden entirely, matching the Fruits page's approach

**WhatsApp order confirmation implemented**:
- `functions/src/lib/whatsapp.ts` — a thin client for the WhatsApp Business Platform (Meta Graph
  API), using Node 20's native `fetch`. Sends a **template** message, not free-form text — Meta
  only allows business-initiated messages like an order confirmation via a pre-approved template;
  free-form text only works if the customer messaged the business within the last 24 hours, which
  is never true for a brand-new order
- `functions/src/notifications.ts` — the `onOrderCreated` Firestore trigger: fires when the
  checkout Server Action writes a new `orders` doc, looks up the customer, sends the template with
  the customer's name/items/total/delivery window, and records `whatsappSentAt` on success. Never
  throws on failure (a bad phone number or an expired token shouldn't retry-storm the trigger or
  block anything — the order is already confirmed on-screen regardless of this message)
- `functions/.env.example` — documents `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`, with
  a note to use a permanent System User token (not the 24-hour quickstart token) and to bind both
  as Cloud Functions **secrets** in production rather than plain env vars, since this token can
  send messages on the business's behalf. The function definition already declares them via the
  `secrets` option, which Firebase Functions v2 requires for Secret Manager values to reach
  `process.env` at runtime

**Before this sends anything real**, a message template needs to exist and be approved in Meta
Business Manager. A starting definition matching what the code sends (name, items summary, total,
delivery window, in that order):

```
Name: order_confirmation
Category: Utility
Language: English

Body: Hi {{1}}, your Raheja Fruits order is confirmed! {{2}}. Total: ₹{{3}}.
Delivery tomorrow, {{4}}. Thanks for ordering with us!
```

Template review can take anywhere from a few hours to a couple of days, so this is worth submitting
early rather than the night before launch.

**Customers page implemented**:
- `functions/src/customers.ts` — `setCustomerStatus` (disable/re-enable an account). Firestore
  rules deliberately don't let an admin write a customer's `status` field directly (only the
  customer's own doc can update itself, and even then not `status`/`pinHash`), so this goes
  through the same admin-guard + audit-log pattern as invites/fruits, rather than a raw client write
- `app/(protected)/customers/page.tsx` — searchable/filterable list (name, phone, building) on the
  left, a detail panel on the right showing delivery address, membership/last-order dates, full
  order history, and the disable/re-enable action (hidden entirely for `read_only`)

**Procurement report implemented**:
- `lib/procurement.ts` — pure aggregation: sums fruit quantities across every order sharing a
  delivery date, using a plain `YYYY-MM-DD` string key rather than Date comparisons (sidesteps
  timezone bugs entirely). Derives the list of upcoming delivery dates straight from the same
  `useRecentOrders()` subscription the dashboard already uses
- `lib/excel-export.ts` — client-side `.xlsx` generation via `exceljs` (already a declared
  dependency from the original scaffold), triggering a browser download directly — no Route
  Handler needed for this one, since the aggregation is already happening client-side
- `app/(protected)/procurement/page.tsx` — a delivery-date selector (defaults to the soonest
  upcoming date), the aggregated table with a total row, and the Export to Excel button

**Order dashboard implemented**:
- `lib/orders.ts` — `useRecentOrders()`, a real-time subscription to the most recent 200 orders
  (plenty for a single society's volume; avoids standing up a composite index per filter
  combination), plus `ACTIVE_STATUSES` (placed/packed/out_for_delivery — "what still needs
  attention" as opposed to a finished delivered/undelivered state)
- `app/(protected)/page.tsx` (Dashboard, `/`) — stat cards (orders + revenue in the pipeline,
  orders + revenue placed today), a status breakdown row across all five statuses, and quick links
  into Orders/Procurement/Packing List. Open to every role — it's a summary view, not a mutation
- `app/(protected)/orders/page.tsx` (`/orders`) — the full order list with building/wing (cascading,
  same pattern as the invite form) and status filters, applied client-side over the same 200-order
  subscription
- `components/orders/order-status-badge.tsx`, `orders-table.tsx`, `orders-filter-bar.tsx`,
  `components/dashboard/stat-card.tsx` — read-only for now; no status-transition controls here on
  purpose, since per architecture doc §7.7 that belongs on the Packing List screen, not Orders

**Fixed: `firebase-admin` was leaking into client bundles.** `@raheja/shared`'s main barrel
(`src/index.ts`) used to re-export `./firebase/admin`, which meant *any* Client Component
importing anything from `@raheja/shared` — including plain files like the login page — pulled
`firebase-admin` into the browser bundle and broke with `Module not found: Can't resolve 'net'`.

Fixed by splitting the package in two:
- `@raheja/shared` (the main barrel) — types, Zod schemas, and pure utilities only. 100%
  browser-safe. This is what every Client Component, hook, and hook-adjacent file imports.
- `@raheja/shared/server` (`src/server.ts`) — `firebase-admin` helpers (`adminAuth`, `adminDb`)
  and the bcrypt PIN-hashing helpers (`hashPin`, `verifyPinHash`). Import this **only** from code
  guaranteed to run server-side: Next.js Server Actions (`"use server"` files), Route Handlers,
  and Cloud Functions. It replaces the old `@raheja/shared/auth/pin` subpath, which is gone.

Only two files in the whole repo need the server subpath, and both already had it applied:
`apps/customer/src/actions/checkout.ts` (a `"use server"` file) and `functions/src/auth.ts`
(a Cloud Function). Every other Cloud Function talks to `firebase-admin/firestore` /
`firebase-admin/auth` directly rather than through the shared wrapper, so they were unaffected.

Verified with a static import-graph trace across every client-reachable file in both apps,
correctly respecting the `"use server"` boundary (Next.js replaces such files with a
server-action-reference stub in the client bundle rather than inlining their imports) — confirms
`firebase-admin` is unreachable from any client-bundled file, while still reachable from
`@raheja/shared/server` itself. A full `pnpm install && next build` in an environment with
registry access is the last-mile check to run before trusting this in production, since this
sandbox doesn't have outbound network access to install real `node_modules`.


**Fruit management implemented**:
- `functions/src/fruits.ts` — `upsertFruit` (create or update, audit-logged with before/after),
  `toggleFruitAvailability` (the fast one-click Available/Out of Stock switch, kept separate from
  the full edit form), and `deleteFruit` (restricted to `super_admin` only, since it's more
  destructive than a price change)
- `storage.rules` + `firebase.json` — Firebase Storage config for fruit photos: public read (a
  produce photo isn't sensitive, and the customer catalogue needs to display it), admin-only write,
  capped at 5MB and `image/*` content types
- `lib/image-upload.ts` (admin) — uploads to Storage and returns the download URL, used by the form
- `app/(protected)/fruits/page.tsx` — form (photo, name, unit, category, retail/member price, sort
  order) + a live catalogue table with inline availability toggle, Edit, and Delete
- Role-gated per §7.1: `super_admin`/`procurement` can create/edit, only `super_admin` can delete,
  and `read_only` sees the table without the form or any write controls (the nav, page guard, and
  table props all agree on this now — worth flagging since the first pass had a bug where the nav
  showed Fruits to `read_only` but the page guard would've bounced them straight back out)

**Invite generation implemented**:
- `functions/src/invites.ts` — `createInvite` (admin-only; validates the building/wing, generates
  a unique `RF-XXXXXX` code, blocks a duplicate pending invite for the same phone, writes the
  invite + an audit log entry) and `revokeInvite`
- `functions/src/lib/require-admin.ts` — reusable server-side admin+role guard for callables (the
  actual enforcement layer behind every admin mutation, not just the client-side UX redirect)
- `functions/src/lib/audit.ts` — shared `writeAuditLog()` helper, used by `createInvite`/
  `revokeInvite` and meant to be reused by every future admin mutation (fruit price changes,
  customer disable, etc.)
- `app/(protected)/invites/page.tsx` (admin) — a form with cascading building→wing dropdowns,
  showing the generated code + a copyable shareable link on success, plus a live table of recent
  invites with a Revoke action for pending ones
- The customer `register` page now reads `?invite=` from the URL to prefill the code, matching the
  link `createInvite` generates (`https://app.rahejafruits.in/register?invite=RF-XXXXXX`)
- Note: this closes the loop end-to-end — an admin can generate an invite, and a customer can
  redeem it — but both sides depend on at least one `buildings` doc existing already (no building
  management UI yet; see the seed-script item still on the list below)

**Admin login + auth guard implemented** (admin app):
- `app/login/page.tsx` — email/password sign-in (Firebase Auth), outside the sidebar chrome
- `app/(protected)/layout.tsx` — sidebar nav + auth guard wrapping every other admin route, using
  a Next.js route group so `/login` doesn't inherit the dashboard chrome
- `hooks/use-auth.tsx` — current Firebase user + their `admins/{uid}` doc (role, isActive)
- `hooks/use-require-admin-auth.ts` — redirects signed-out/inactive admins to `/login`; pages can
  pass `useRequireAdminAuth(["super_admin", "procurement"])` etc. to restrict by role, matching
  the role table in architecture doc §7.1. Every protected page stub already calls this with its
  correct allowed roles, and the sidebar hides nav items a given role can't use.
- No self-registration for admins — the first `admins/{uid}` doc must be created manually (e.g.
  via the Firestore console or a seed script) after signing up through Firebase Auth directly,
  since invite-only registration in this codebase is customer-only.


This is a scaffold: folder structure, config files, Firestore security rules, shared types/schemas,
and page stubs are in place. Business logic (checkout/cutoff enforcement, WhatsApp integration, Excel
export) still needs to be implemented — see inline `// TODO` comments.

**Login/PIN flow is implemented** (customer app):
- `functions/src/auth.ts` — three callables: `checkInvite`, `completeRegistration`, `verifyPin`
- `packages/shared/src/auth/pin.ts` — bcrypt PIN hashing (server-only, not exported from the
  package's main barrel — import the `@raheja/shared/auth/pin` subpath directly)
- `packages/shared/src/auth/lockout.ts` — pure lockout policy (5 failed attempts → 15 min lock)
- `apps/customer/src/app/(auth)/login/page.tsx` — mobile + PIN login form
- `apps/customer/src/app/(auth)/register/page.tsx` — 3-step invite → OTP → PIN setup flow
- `apps/customer/src/hooks/use-auth.tsx`, `use-require-auth.ts`, `use-phone-otp.ts`

Registration uses Firebase phone Auth OTP **once**, at invite redemption, to prove phone ownership.
Everyday login is mobile + PIN, verified server-side in `verifyPin`, which mints a custom token.
No PIN is ever compared or stored client-side.

**Cart and checkout are implemented** (customer app):
- `cart/page.tsx` — line items with qty steppers, subtotal/savings, ₹500 minimum-order progress bar,
  empty state, sticky "Proceed to checkout" bar
- `checkout/page.tsx` — delivery address (read-only, from profile + `buildings` lookup), order
  summary, Pay-on-Delivery notice, an explicit no-cancellation acknowledgement checkbox required
  before the order can be placed
- `actions/checkout.ts` — the real order-creation Server Action: verifies the caller's Firebase ID
  token server-side, re-prices every line from the live `fruits` collection (client prices are
  display-only), drops anything that's gone Out of Stock, enforces the 8:00 PM cutoff and ₹500
  minimum against the *server-computed* subtotal, then writes the order with price snapshots

Note: Server Actions don't automatically see the client's Firebase Auth session in this scaffold
(no session-cookie bridge is set up), so the checkout page passes `auth.currentUser.getIdToken()`
to the action explicitly, which verifies it via `adminAuth().verifyIdToken()` before trusting `uid`.

**Order history + reorder implemented** (customer app):
- `lib/orders.ts` — real-time subscription to the signed-in customer's orders (status changes made
  by admins, e.g. packed → out for delivery, show up live)
- `components/orders/order-card.tsx` + `status-badge.tsx` — order cards with items, total, delivery
  window, and status
- `lib/reorder.ts` — reorder never trusts the old order's price/availability snapshot; it re-fetches
  each item's *current* `fruits` doc, silently drops anything gone Out of Stock, and repopulates
  `useCartStore` at today's prices before routing to `/cart`
- Loading skeleton, empty state, and the post-checkout "Order placed!" confirmation banner

**PWA icons generated** (`apps/customer/public/icons/`): a simple apple-and-leaf mark on the
leaf-green brand color, matching the catalogue's palette — `icon-192.png`, `icon-512.png`,
`apple-touch-icon.png` (180px), `favicon-32.png`. Wired into both `manifest.json` and the root
layout's `metadata.icons`.

**Fruit catalogue UI is implemented** (customer app, `apps/customer/src/app/catalogue/page.tsx`):
- Real-time `fruits` subscription (`src/lib/fruits.ts`) — an admin toggling Out of Stock reflects instantly
- `FruitCard` — retail price struck through, member price in the display face, a rotated "SAVE ₹X"
  market-stamp badge (the page's signature element), and a quantity stepper wired to `useCartStore`
- Category filter chips, a live countdown chip for the 8:00 PM cutoff, loading skeleton, empty state
- Sticky bottom cart bar showing item count/subtotal and progress toward the ₹500 minimum
- Palette/type: sage-white + leaf-green + Fraunces/Inter — deliberately not the cream+terracotta
  "AI default" look; see inline comments in `globals.css` and `tailwind.config.ts`
