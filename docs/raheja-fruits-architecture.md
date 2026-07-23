# Raheja Fruits — Technical Architecture Document

**Tagline:** Fresh Fruits at Member Prices
**Version:** 1.0
**Date:** July 2026

---

## 1. Overview

Raheja Fruits is an invite-only, community-scoped grocery ordering platform serving residents of Raheja Estate buildings. It consists of two separate deployed applications sharing one Firebase backend:

| App | Domain | Audience |
|---|---|---|
| Customer app | `app.rahejafruits.in` | Approved residents |
| Admin app | `admin.rahejafruits.in` | Staff / operators |

Both are Next.js 15 (App Router) projects, deployed independently on Firebase Hosting, and both read/write the same Firestore project. Splitting into two apps rather than one app with route-based role gating keeps the customer bundle small, keeps admin tooling (Excel export, audit log, packing list generation) out of the public build, and lets each app have its own security posture and CI pipeline.

### 1.1 Goals
- Fast, mobile-first ordering experience (most usage is on phones, likely on WhatsApp-shared links).
- Zero self-service signup — every account originates from an admin-issued invite.
- Hard operational cutoffs (8:00 PM order close, no cancellation) enforced server-side, not just in the UI.
- Admin visibility into procurement, packing, and delivery status without needing a separate BI tool.
- Installable PWA so returning customers don't need to re-navigate to the domain each morning.

### 1.2 Non-Goals (v1)
- Online payment (Pay on Delivery only for v1).
- Multi-society / multi-tenant support beyond the "Raheja Estate" building list.
- Real-time chat support (WhatsApp confirmation is a message, not a chat integration).

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | Server Components by default; Route Handlers for mutations where Server Actions don't fit |
| Language | TypeScript | Strict mode on |
| Styling | Tailwind CSS + shadcn/ui | shadcn components copied into repo, not an npm dependency, so they can be themed per app |
| Auth | Firebase Authentication | Phone number as identity; custom PIN layer on top (see §5) |
| Database | Firestore | Single project, security-rules-enforced multi-app access |
| Hosting | Firebase Hosting | Two Hosting sites in one Firebase project, mapped to the two custom domains |
| Client state | Zustand | Cart, UI state, ephemeral session data |
| Forms | React Hook Form + Zod | Shared Zod schemas between client validation and Server Action validation |
| CI/CD | GitHub Actions | Separate workflows per app, deploying to separate Hosting sites |
| Offline/installable | PWA (next-pwa or manual service worker) | Customer app only |

---

## 3. High-Level Architecture

```
                        ┌─────────────────────────┐
                        │   Firebase Project        │
                        │                            │
                        │  ┌──────────────────────┐  │
   ┌─────────────┐      │  │ Firestore              │  │      ┌─────────────┐
   │ Customer App │◄────┼──┤ - customers            │  ├─────►│  Admin App   │
   │ app.rahejaf..│      │  │ - buildings            │  │      │ admin.raheja│
   │ (Next.js PWA)│      │  │ - fruits               │  │      │ (Next.js)   │
   └──────┬───────┘      │  │ - orders               │  │      └──────┬──────┘
          │              │  │ - invites              │  │             │
          │              │  │ - auditLog             │  │             │
          │              │  └──────────────────────┘  │             │
          │              │                            │             │
          │              │  Firebase Authentication    │             │
          │              │  (Phone number identity)    │             │
          │              │                            │             │
          │              │  Cloud Functions            │             │
          │              │  - PIN verification          │             │
          │              │  - order cutoff enforcement  │             │
          │              │  - WhatsApp send             │             │
          │              │  - Excel export generation   │             │
          │              └─────────────┬──────────────┘             │
          │                            │                            │
          └────────── shared Firestore + Auth backend ───────────────┘
```

Both apps talk to Firestore directly from Server Components/Server Actions using the Firebase Admin SDK where trusted server-side logic is needed (e.g., price calculation, cutoff checks), and use the Firebase Client SDK in the browser only for Auth state and light reads protected by Firestore Security Rules.

**Key architectural decision:** business-critical rules — order cutoff time, minimum order value, price snapshotting, no-cancellation — are enforced in Server Actions / Cloud Functions, never trusted from the client. The client UI reflects these rules for UX but the server is the source of truth.

---

## 4. Data Model (Firestore)

Firestore is document-oriented; the schema below is denormalized where it helps read performance (e.g., price snapshot on order line items) and normalized where consistency matters (e.g., building list as a single source of truth for dropdowns).

### 4.1 `buildings`
```
buildings/{buildingId}
  name: string              // e.g. "Raheja Acropolis - A Wing"
  wings: string[]            // e.g. ["A", "B", "C"]
  isActive: boolean
  createdAt: timestamp
```
Used to populate the Building dropdown and to validate that a customer's delivery address belongs to the approved estate list.

### 4.2 `customers`
```
customers/{customerId}       // customerId === Firebase Auth UID
  phone: string               // E.164, also the Auth identity
  name: string
  pinHash: string              // bcrypt/argon2 hash, never stored plain
  buildingId: string            // ref -> buildings
  wing: string
  flatNumber: string
  status: "invited" | "active" | "disabled"
  inviteId: string               // ref -> invites, for traceability
  createdAt: timestamp
  lastOrderAt: timestamp | null
```

### 4.3 `invites`
```
invites/{inviteId}
  phone: string
  buildingId: string
  wing: string
  flatNumber: string
  code: string                  // one-time invite code, shown/sent by admin
  status: "pending" | "redeemed" | "expired" | "revoked"
  createdBy: string              // admin uid
  createdAt: timestamp
  redeemedAt: timestamp | null
```
Registration is invite-only: a customer must present a valid invite code (or land on a unique invite link) before Firebase phone Auth + PIN setup is allowed.

### 4.4 `fruits`
```
fruits/{fruitId}
  name: string
  unit: string                  // "kg", "dozen", "piece"
  imageUrl: string
  retailPrice: number            // in paise/rupees, admin sets both
  memberPrice: number
  isAvailable: boolean
  category: string | null
  sortOrder: number
  updatedAt: timestamp
  updatedBy: string               // admin uid, for audit trail
```
`retailPrice - memberPrice` drives the "You Save" display; this is computed client-side for display but the **server recomputes it at order time** from the current `fruits` doc, not from client-submitted values.

### 4.5 `orders`
```
orders/{orderId}
  customerId: string
  buildingId: string
  wing: string
  flatNumber: string
  items: [
    {
      fruitId: string
      name: string                // snapshot, in case fruit is later renamed
      unit: string
      retailPriceAtOrder: number   // snapshot
      memberPriceAtOrder: number   // snapshot
      quantity: number
      lineTotal: number
    }
  ]
  subtotal: number
  totalSavings: number
  status: "placed" | "packed" | "out_for_delivery" | "delivered" | "undelivered"
  paymentMethod: "cod"            // fixed for v1
  placedAt: timestamp
  deliveryDate: timestamp          // next morning, derived from placedAt + cutoff logic
  deliveryWindow: "06:00-07:00"
  whatsappSentAt: timestamp | null
  cancellable: false               // always false post-placement; field exists for clarity/future
```
Price fields are **snapshotted** onto the order at placement time so later price changes in `fruits` never retroactively alter past orders — required for accurate procurement reports and audit trail.

### 4.6 `auditLog`
```
auditLog/{logId}
  actorId: string                 // admin uid
  actorRole: string
  action: string                   // e.g. "price_update", "invite_created", "fruit_disabled"
  targetType: string                // "fruit" | "customer" | "order" | "invite"
  targetId: string
  before: object | null
  after: object | null
  timestamp: timestamp
```
Every admin mutation (price change, stock toggle, invite creation, customer disable, order status override) writes an audit entry via a Cloud Function trigger or a shared server-side helper, never left to individual admin pages to remember.

### 4.7 `admins`
```
admins/{adminId}                 // adminId === Firebase Auth UID
  name: string
  phone: string
  role: "super_admin" | "operations" | "procurement" | "read_only"
  isActive: boolean
  createdAt: timestamp
```
Roles gate which admin routes and Server Actions a user may call — enforced both in UI (hide/disable) and in Firestore Security Rules / Server Action guards (the real enforcement layer).

---

## 5. Authentication & Authorization

### 5.1 Customer login: Mobile + PIN
Firebase Authentication's phone provider handles the OTP/SMS verification step *once*, at registration, to prove ownership of the number. After that, day-to-day login uses a **4–6 digit PIN**, not repeated SMS OTPs, to reduce friction and SMS cost:

1. **Invite redemption (first time only):** customer receives invite link/code → enters code → Firebase phone Auth OTP verifies the number → customer sets a PIN → PIN is hashed (argon2id) and stored on the `customers` doc → a custom Firebase Auth session is established.
2. **Return login:** customer enters mobile number + PIN → a Server Action verifies the PIN hash against `customers.pinHash` → on success, a Firebase custom token is minted server-side (Admin SDK) and returned to the client → client signs in with `signInWithCustomToken`.
3. PIN verification never happens client-side against a plaintext or client-fetched hash — it's a server call.
4. Rate limiting / lockout after repeated failed PIN attempts (e.g., 5 attempts → temporary lock) implemented via a `loginAttempts` sub-collection or a Cloud Function using a token-bucket keyed by phone number.

### 5.2 Admin login
Admins authenticate via Firebase Auth (email/password or phone), and their `admins` doc's `role` field determines feature access. Because `admin.rahejafruits.in` is a separate deployed app, it never ships the customer PIN-login UI at all — reducing attack surface.

### 5.3 Authorization enforcement
- **Firestore Security Rules** are the last line of defense: customers can only read/write their own `customers` doc and `orders` where `customerId == request.auth.uid`; only `admins` with appropriate roles can write to `fruits`, `invites`, `buildings`.
- **Server Actions** re-check role/ownership server-side before mutating, since Security Rules alone are hard to express for complex conditional logic (e.g., "cutoff time has not passed").
- Building/wing/flat is **locked** to what's on the customer's profile — the checkout flow does not let a customer type a free-text address; it reads from their `customers` doc, which was set at invite time and can only be changed by an admin (prevents delivery to unapproved buildings).

---

## 6. Customer App — Feature Flows

### 6.1 Registration (invite-only)
1. Admin creates an invite (phone + building + wing + flat) → `invites` doc created, status `pending`, link/code sent via WhatsApp (manually or via a Cloud Function calling a WhatsApp Business API/click-to-chat link).
2. Customer opens invite link → prefilled building/wing/flat (read-only) → OTP verification → PIN setup → `customers` doc created with `status: active`, invite marked `redeemed`.

### 6.2 Catalogue & Cart
- Server Component fetches `fruits` where `isAvailable == true`, ordered by `sortOrder`.
- Each card shows retail price (strikethrough), member price, and computed "You Save" badge.
- Cart is a **Zustand store**, persisted to `localStorage`/IndexedDB (not Firestore) until checkout — keeps cart snappy and avoids write costs for abandoned carts.
- Add-to-cart, quantity change, and remove are pure client-side state operations against the Zustand store.

### 6.3 Checkout
1. Cart page shows subtotal, savings, and delivery address (read-only, pulled from profile).
2. **₹500 minimum order** is validated client-side for immediate feedback, and re-validated server-side in the Server Action that creates the order (client validation is UX only).
3. **Order cutoff (8:00 PM)** check: Server Action compares `serverTimestamp()` against today's 20:00 IST cutoff. If past cutoff, the order is rejected (or, per product decision, auto-scheduled for the following delivery day — this should be confirmed with the business owner; documented as an open question in §12).
4. On success: order doc created with price snapshots, `deliveryDate` set to next calendar day, `deliveryWindow` set to `06:00–07:00`.
5. Confirmation triggers a WhatsApp message (see §6.5).
6. **No cancellation** — once `orders/{orderId}` is created, no client-facing "cancel" action exists in the UI, and Security Rules explicitly deny customer-side updates/deletes to `orders` after creation (only admins can update `status`).

### 6.4 Order History & Reorder
- Customer app queries `orders` where `customerId == uid`, ordered by `placedAt desc`.
- "Reorder" reads a past order's `items`, looks up **current** `fruits` prices/availability (not the snapshot), and repopulates the Zustand cart — so customers always reorder at today's prices and only with currently available items.

### 6.5 WhatsApp Confirmation
- Implemented via a Cloud Function triggered `onCreate` of an `orders` doc, calling either the WhatsApp Business Platform API (if the business has an approved sender) or generating a `wa.me` deep link the customer taps post-checkout. Recommend starting with the official WhatsApp Business API for reliability and to log `whatsappSentAt`.

### 6.6 PWA
- `manifest.json` with app icon/name for "Add to Home Screen".
- Service worker caches the app shell and the fruit catalogue's static assets (images) for fast repeat loads; **does not** cache authenticated order data aggressively, to avoid stale price/availability issues — network-first strategy for Firestore-backed data, cache-first for static assets.

---

## 7. Admin App — Feature Flows

### 7.1 Roles
| Role | Capabilities |
|---|---|
| `super_admin` | Everything, including admin user management |
| `operations` | Orders, delivery status, packing list, customer management |
| `procurement` | Procurement report, fruit price/stock management |
| `read_only` | View-only dashboards, exports |

### 7.2 Customer Management
- List/search customers by name, phone, building.
- View a customer's order history.
- Disable a customer (sets `status: disabled`, which Security Rules check to block that customer's future writes).

### 7.3 Invite Generation
- Form (React Hook Form + Zod) to create an invite: phone, building (dropdown from `buildings`), wing, flat.
- Generates a shareable link/code; optionally triggers a WhatsApp click-to-chat prefilled message.

### 7.4 Fruit Management
- CRUD on `fruits`: name, unit, image upload (Firebase Storage), retail price, member price.
- Toggle **Available / Out of Stock** — this is the single flag the customer catalogue query filters on, so it takes effect immediately on next customer page load/revalidation.
- Every price or availability change writes an `auditLog` entry (before/after values).

### 7.5 Order Dashboard
- Real-time (or near-real-time, via `onSnapshot` or periodic revalidation) view of today's orders: count, total value, status breakdown.
- Filter by building/wing for delivery routing.

### 7.6 Procurement Report
- Aggregates all `placed` orders for the next `deliveryDate` and sums `quantity` per `fruitId` → tells procurement how much of each fruit to buy tonight for tomorrow's 6–7 AM delivery.
- Generated as a Server Action / Route Handler that reads orders and returns an aggregated table, exportable to Excel (§7.8).

### 7.7 Packing List & Delivery Status
- Packing list: per-order checklist grouped by building/wing, so delivery staff can pack bags in one pass through the estate.
- Delivery status: admin marks each order `packed` → `out_for_delivery` → `delivered`/`undelivered`; each transition is audit-logged and visible to... (customers do not currently have a tracking UI in this feature list — flagged as a possible v2 addition, see §12).

### 7.8 Excel Export
- Server-side generation (e.g., using `exceljs` in a Route Handler or Cloud Function) of procurement report and packing list as `.xlsx`, downloaded from the admin app. Not client-side generation, to keep heavy libraries out of the browser bundle and to allow scheduled/emailed exports later.

### 7.9 Audit Log
- Read-only admin view over the `auditLog` collection, filterable by actor, action type, date range — the operational record of "who changed what, when."

---

## 8. Business Rules Enforced Server-Side

These are the rules that must **never** be trusted to client-side JavaScript alone:

1. **₹500 minimum order value** — checked in the order-creation Server Action against the server-computed subtotal (from current `fruits` prices at time of add, or cart contents re-priced server-side).
2. **8:00 PM order cutoff** — checked against server time (IST), not client device time, to prevent clock manipulation.
3. **No cancellation** — Firestore Security Rules deny any client update/delete on `orders` after creation; only `admins` roles can transition `status`.
4. **Price integrity** — order line prices are always taken from the server-side `fruits` doc at submission time, never from client-submitted price values, preventing tampering via browser dev tools.
5. **Building/address restriction** — delivery address fields are never free-text from the customer; they're fixed to the profile set at invite time, which itself was constrained to the approved `buildings` list by the admin who created the invite.
6. **Invite-only registration** — Firestore Security Rules and the registration Server Action both require a valid, unredeemed `invites` doc matching the phone number before allowing `customers` doc creation.

---

## 9. State Management (Zustand)

Recommended store slices for the customer app:

| Store | Contents |
|---|---|
| `useCartStore` | cart items, quantity ops, computed subtotal/savings, cleared on successful checkout |
| `useAuthStore` | current customer profile (mirrors Firebase Auth + `customers` doc), login/logout actions |
| `useUiStore` | transient UI state — modals, toasts, loading flags |

Zustand stores are kept **thin**: they hold client state and call Server Actions for anything that touches Firestore truth (price, availability, order creation) rather than duplicating server logic client-side.

---

## 10. Validation (Zod)

Shared Zod schemas live in a `/schemas` package/folder imported by both React Hook Form (client-side UX validation) and Server Actions (authoritative validation), e.g.:

```ts
export const checkoutSchema = z.object({
  items: z.array(z.object({
    fruitId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export const inviteSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  buildingId: z.string(),
  wing: z.string(),
  flatNumber: z.string().min(1),
});
```
Using the same schema on both sides avoids drift between what the form allows and what the server accepts.

---

## 11. CI/CD & Deployment

- **Two GitHub Actions workflows**, one per app (`deploy-customer.yml`, `deploy-admin.yml`), each triggered on push to `main` (or a protected release branch) with path filters so a change to only the admin app doesn't redeploy the customer app.
- Each workflow: install → typecheck → lint → build → `firebase deploy --only hosting:customer` (or `hosting:admin`) using a Firebase service account stored as a GitHub secret.
- **Firebase Hosting multi-site**: one Firebase project, two Hosting "sites" (`raheja-fruits-customer`, `raheja-fruits-admin`), each mapped to its custom domain (`app.rahejafruits.in`, `admin.rahejafruits.in`) via Firebase Hosting custom domain + DNS (A/TXT records with the registrar).
- **Environments:** recommend a `staging` Firebase project (or Hosting preview channels via `firebase hosting:channel:deploy` on PRs) so admin/price changes can be tested before hitting production customers.
- **Cloud Functions** (PIN verification, WhatsApp send, Excel export, audit triggers) deploy via the same or a third workflow (`deploy-functions.yml`).

---

## 12. Open Questions / Recommendations for v2

- What happens to an order attempted after 8:00 PM — hard block, or silently queue for the day after next? Needs a product decision.
- Should customers see live delivery status (`out_for_delivery`), or is that admin-only for v1? Currently spec'd as admin-only.
- Payment: v1 is Pay on Delivery only — consider UPI collection at delivery reconciliation in admin (mark `paid`/`unpaid`) even without in-app payment, to help procurement/finance reconcile.
- Multi-admin conflict handling: two admins editing the same fruit price simultaneously — recommend optimistic concurrency (compare `updatedAt` on write) to avoid silent overwrites.
- SMS/WhatsApp cost: phone Auth OTP is only used once at invite redemption, which keeps SMS costs low — worth confirming Firebase Auth phone provider pricing at expected invite volume.

---

## 13. Security Summary

- All authoritative business logic (pricing, cutoff, minimum order, cancellation lock, building restriction) lives server-side.
- Firestore Security Rules mirror and enforce these rules as a second layer, not the only layer.
- PINs are hashed, never stored or transmitted in plaintext; PIN verification happens via a server-minted custom token, not client-side rule checks.
- Admin actions are fully audit-logged with before/after state.
- Two physically separate deployed apps (customer vs. admin) reduce blast radius — a vulnerability in the public customer app's bundle can't expose admin-only routes because they don't exist in that build.
