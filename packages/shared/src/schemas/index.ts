import { z } from "zod";

// Used at both the form layer (React Hook Form resolver) and the Server
// Action layer, so client UX validation and server authoritative validation
// can never drift apart.

export const MIN_ORDER_VALUE = 500;

export const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Enter a valid Indian mobile number");

export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "PIN must be 4-6 digits");

export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

// --- Auth callable function payloads (functions/src/auth.ts) ---

// Direct registration (no invite step): called after Firebase phone
// Auth OTP has already verified the number client-side (so
// request.auth.uid exists and its phone_number claim matches). Server
// validates the building/wing against Firestore, hashes the PIN, and
// creates the customer doc.
export const registerCustomerSchema = z.object({
  name: z.string().min(2).max(80),
  buildingId: z.string().min(1),
  wing: z.string().min(1),
  flatNumber: z.string().min(1),
  pin: pinSchema,
});

export interface RegisterCustomerResult {
  ok: boolean;
  error?: string;
  // true when settings.customerApprovalRequired created this account
  // with status "pending" instead of "active" — the client should show
  // an "awaiting approval" screen rather than routing to the catalogue,
  // since a pending customer can't read fruits/place orders yet (see
  // firestore.rules' isActiveCustomer()).
  pendingApproval?: boolean;
}

// PIN login: server verifies the hash and mints a custom token.
export const verifyPinSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

export interface VerifyPinResult {
  ok: boolean;
  customToken?: string;
  error?: string;
  lockedUntil?: number;
}

// Admin-side address edit (Residents page) — re-validates the
// building/wing the same way registerCustomer does.
export const updateCustomerAddressSchema = z.object({
  customerId: z.string().min(1),
  buildingId: z.string().min(1),
  wing: z.string().min(1),
  flatNumber: z.string().min(1),
});

export const cartItemSchema = z.object({
  fruitId: z.string().min(1),
  quantity: z.number().int().positive().max(50),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
});

export const fruitUpsertSchema = z.object({
  fruitId: z.string().optional(), // present = update, absent = create
  name: z.string().min(1).max(60),
  unit: z.enum(["kg", "dozen", "piece", "box"]),
  imageUrl: z.string().url().optional(),
  retailPrice: z.number().positive(),
  memberPrice: z.number().positive(),
  category: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
}).refine((data) => data.memberPrice <= data.retailPrice, {
  message: "Member price cannot exceed retail price",
  path: ["memberPrice"],
});

export type FruitUpsertInput = z.infer<typeof fruitUpsertSchema>;

export interface UpsertFruitResult {
  ok: boolean;
  fruitId?: string;
  error?: string;
}

export const toggleFruitAvailabilitySchema = z.object({
  fruitId: z.string().min(1),
  isAvailable: z.boolean(),
});

export const deleteFruitSchema = z.object({
  fruitId: z.string().min(1),
});

export interface FruitMutationResult {
  ok: boolean;
  error?: string;
}

export const setCustomerStatusSchema = z.object({
  customerId: z.string().min(1),
  status: z.enum(["active", "disabled", "pending"]),
});

export interface CustomerMutationResult {
  ok: boolean;
  error?: string;
}

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["placed", "packed", "out_for_delivery", "delivered", "undelivered"]),
});

export interface OrderMutationResult {
  ok: boolean;
  error?: string;
}

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// --- Business Settings (apps/admin/src/app/(protected)/settings) ---

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM (24-hour)");

// Optional-but-valid-if-present — support contact fields aren't
// mandatory to run the store, but a garbled phone/email helps no one.
const optionalPhoneSchema = z.union([z.literal(""), phoneSchema]);
const optionalEmailSchema = z.union([z.literal(""), z.string().email("Enter a valid email")]);

export const businessSettingsSchema = z
  .object({
    // Store
    storeName: z.string().trim().min(1, "Required").max(80),
    storeTagline: z.string().trim().max(140),
    supportPhone: optionalPhoneSchema,
    supportWhatsapp: optionalPhoneSchema,
    supportEmail: optionalEmailSchema,
    currency: z.string().trim().min(1, "Required").max(8),

    // Orders
    minimumOrder: z.coerce.number().min(0, "Can't be negative"),
    deliveryCharge: z.coerce.number().min(0, "Can't be negative"),
    freeDeliveryAbove: z.coerce.number().min(0, "Can't be negative"),
    maxOrdersPerDay: z.coerce.number().int().min(0, "Can't be negative"),
    acceptOrders: z.boolean(),
    allowOutOfStockOrders: z.boolean(),

    // Business hours
    storeStatus: z.enum(["open", "closed"]),
    maintenanceMode: z.boolean(),
    maintenanceMessage: z.string().trim().max(280),
    businessHours: z.object({ open: timeSchema, close: timeSchema }),
    cutOffTime: timeSchema,
    deliveryStartTime: timeSchema,
    deliveryEndTime: timeSchema,
    holidayMessage: z.string().trim().max(280),

    // Customers
    registrationEnabled: z.boolean(),
    customerApprovalRequired: z.boolean(),
    allowProfileEditing: z.boolean(),
    allowMultipleAddresses: z.boolean(),

    // Payments
    paymentMode: z.enum(["cod", "online", "both"]),

    // Homepage
    homepageBannerEnabled: z.boolean(),
    homepageBanner: z.string().trim().max(200),
    homepageBannerColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color, e.g. #1F6D4C"),

    // Notifications
    enableNotifications: z.boolean(),
    enableWhatsapp: z.boolean(),
    enableEmail: z.boolean(),
    enableSMS: z.boolean(),
    enablePushNotifications: z.boolean(),

    // Invoice
    invoicePrefix: z.string().trim().min(1, "Required").max(6),
    invoiceStartingNumber: z.coerce.number().int().min(1, "Must be at least 1"),
    gstNumber: z.string().trim().max(20),

    // Wholesale
    showWholesalePrices: z.boolean(),
  })
  .refine((d) => d.freeDeliveryAbove >= d.minimumOrder, {
    message: "Can't be less than the minimum order amount",
    path: ["freeDeliveryAbove"],
  });

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
