/**
 * Shared Firestore document types.
 * Mirrors the data model in /docs/raheja-fruits-architecture.md §4.
 * Imported by both apps/customer and apps/admin so client + server + Cloud
 * Functions all agree on shape.
 */

import { MIN_ORDER_VALUE } from "../schemas";

export type Timestamp = string; // ISO string on the client; Firestore Timestamp on the server

export interface Building {
  id: string;
  name: string;
  wings: string[]; // assembled client-side from the wings subcollection — see hooks/lib/buildings.ts
  isActive: boolean;
  createdAt: Timestamp;
  createdBy?: string; // optional — buildings seeded before the admin UI existed don't have this
  updatedAt?: Timestamp;
  updatedBy?: string;
}

// A single wing document at buildings/{buildingId}/wings/{wingId}.
// Field name is deliberately `active`, not `isActive` — matches the
// existing subcollection schema (see createInvite/registerCustomer's
// own wing lookups), not a typo.
export interface BuildingWing {
  id: string;
  name: string;
  active: boolean;
}

export type CustomerStatus = "active" | "disabled" | "pending";

export interface Customer {
  id: string; // === Firebase Auth UID
  phone: string; // E.164
  name: string;
  pinHash: string; // never sent to the client
  buildingId: string;
  buildingName: string; // denormalized snapshot for display without a join
  wing: string;
  flatNumber: string;
  address: string; // composed display string, e.g. "Bhoomi Flora, Wing A, Flat 1803"
  status: CustomerStatus;
  createdAt: Timestamp;
  lastOrderAt: Timestamp | null;
}

// Client-safe view of a customer (never includes pinHash)
export type CustomerProfile = Omit<Customer, "pinHash">;

export interface Fruit {
  id: string;
  name: string;
  unit: string; // "kg" | "dozen" | "piece" etc.
  imageUrl: string;
  retailPrice: number;
  memberPrice: number;
  isAvailable: boolean;
  // Soft-delete flag (Milestone 2): false means the fruit is "deleted" —
  // hidden from every listing (admin + customer) but the document (and
  // its audit trail) is kept, never removed. Docs written before this
  // field existed have it undefined, which every reader treats as true.
  isActive: boolean;
  category: string | null;
  sortOrder: number;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface OrderLineItem {
  fruitId: string;
  name: string; // snapshot at order time
  unit: string;
  retailPriceAtOrder: number;
  memberPriceAtOrder: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus =
  | "placed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "undelivered";

export interface Order {
  id: string;
  orderNumber: string;

  // Professional order number shown to customers
  
  customerId: string;
  buildingId: string;
  wing: string;
  flatNumber: string;
  items: OrderLineItem[];
  subtotal: number;
  totalSavings: number;
  deliveryCharge?: number; // optional — orders placed before Business Settings existed don't have this
  total?: number; // subtotal + deliveryCharge, same caveat
  status: OrderStatus;
  paymentMethod: "cod";
  placedAt: Timestamp;
  deliveryDate: Timestamp;
  deliveryWindow: "06:00-07:00";
  whatsappSentAt: Timestamp | null;
  cancellable: false;
}

export type AdminRole = "super_admin" | "operations" | "procurement" | "read_only";

export interface Admin {
  id: string; // === Firebase Auth UID
  name: string;
  phone: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: "fruit" | "customer" | "order" | "building" | "settings";
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: Timestamp;
}

// --- Business Settings: a single document (settings/business) holding
// every business rule an admin should be able to change without a code
// deploy. Only super_admin may read or write it — see firestore.rules.
// Grouped by UI section below purely for readability; Firestore stores
// them as one flat document (businessHours is the one nested object,
// since "store open/close" naturally pairs together).
export type PaymentMode = "cod" | "online" | "both";
export type StoreStatus = "open" | "closed";

export interface BusinessHours {
  open: string; // "HH:mm", 24-hour
  close: string;
}

export interface BusinessSettings {
  // Store
  storeName: string;
  storeTagline: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportEmail: string;
  currency: string;

  // Orders
  minimumOrder: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  maxOrdersPerDay: number; // 0 = unlimited
  acceptOrders: boolean;
  allowOutOfStockOrders: boolean;

  // Business hours
  storeStatus: StoreStatus;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  businessHours: BusinessHours;
  cutOffTime: string; // "HH:mm"
  deliveryStartTime: string;
  deliveryEndTime: string;
  holidayMessage: string;

  // Customers
  registrationEnabled: boolean;
  customerApprovalRequired: boolean;
  allowProfileEditing: boolean;
  allowMultipleAddresses: boolean;

  // Payments
  paymentMode: PaymentMode;

  // Homepage
  homepageBannerEnabled: boolean;
  homepageBanner: string; // banner text
  homepageBannerColor: string; // hex color, e.g. "#1F6D4C"

  // Notifications
  enableNotifications: boolean;
  enableWhatsapp: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  enablePushNotifications: boolean;

  // Invoice
  invoicePrefix: string;
  invoiceStartingNumber: number;
  gstNumber: string;

  // Wholesale
  showWholesalePrices: boolean;

  updatedAt: Timestamp;
  updatedBy: string;
}

// Sensible starting point for a brand-new project (no settings doc
// saved yet) and what "Reset to Default" restores the form to. Kept
// separate from the Zod schema below so the UI can use it without
// pulling in validation logic, and vice versa.
export const DEFAULT_BUSINESS_SETTINGS: Omit<BusinessSettings, "updatedAt" | "updatedBy"> = {
  storeName: "Raheja Fruits",
  storeTagline: "Fresh fruits delivered daily",
  supportPhone: "",
  supportWhatsapp: "",
  supportEmail: "",
  currency: "INR",

  minimumOrder: MIN_ORDER_VALUE,
  deliveryCharge: 0,
  freeDeliveryAbove: 500,
  maxOrdersPerDay: 0,
  acceptOrders: true,
  allowOutOfStockOrders: false,

  storeStatus: "open",
  maintenanceMode: false,
  maintenanceMessage: "We'll be back shortly.",
  businessHours: { open: "07:00", close: "20:00" },
  cutOffTime: "20:00",
  deliveryStartTime: "06:00",
  deliveryEndTime: "09:00",
  holidayMessage: "",

  registrationEnabled: true,
  customerApprovalRequired: false,
  allowProfileEditing: true,
  allowMultipleAddresses: false,

  paymentMode: "cod",

  homepageBannerEnabled: false,
  homepageBanner: "",
  homepageBannerColor: "#1F6D4C",

  enableNotifications: true,
  enableWhatsapp: false,
  enableEmail: false,
  enableSMS: false,
  enablePushNotifications: false,

  invoicePrefix: "RF",
  invoiceStartingNumber: 10001,
  gstNumber: "",

  showWholesalePrices: false,
};

// --- The subset of BusinessSettings that's safe for any signed-in
// (or even anonymous) visitor to read — no GST number, no invoice
// numbering, nothing operationally sensitive. Mirrored into
// settings/public by saveBusinessSettings (see
// apps/admin/src/lib/settings.ts) whenever the admin saves, so the
// customer app can show live minimum-order/delivery/maintenance info
// without needing read access to the full settings/business doc.
//
// Adding a new customer-facing setting later: add the field to
// BusinessSettings above, add it here, add it to
// toPublicBusinessSettings() below. Nothing else in the architecture
// needs to change — this function is the one place that decides what's
// public. ---
export interface PublicBusinessSettings {
  storeName: string;
  storeTagline: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportEmail: string;
  minimumOrder: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  acceptOrders: boolean;
  allowOutOfStockOrders: boolean;
  storeStatus: StoreStatus;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  businessHours: BusinessHours;
  holidayMessage: string;
  registrationEnabled: boolean;
  paymentMode: PaymentMode;
  currency: string;
  homepageBannerEnabled: boolean;
  homepageBanner: string;
  homepageBannerColor: string;
  enableNotifications: boolean;
  enableWhatsapp: boolean;
}

export function toPublicBusinessSettings(
  s: Omit<BusinessSettings, "updatedAt" | "updatedBy">
): PublicBusinessSettings {
  return {
    storeName: s.storeName,
    storeTagline: s.storeTagline,
    supportPhone: s.supportPhone,
    supportWhatsapp: s.supportWhatsapp,
    supportEmail: s.supportEmail,
    minimumOrder: s.minimumOrder,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryAbove: s.freeDeliveryAbove,
    acceptOrders: s.acceptOrders,
    allowOutOfStockOrders: s.allowOutOfStockOrders,
    storeStatus: s.storeStatus,
    maintenanceMode: s.maintenanceMode,
    maintenanceMessage: s.maintenanceMessage,
    businessHours: s.businessHours,
    holidayMessage: s.holidayMessage,
    registrationEnabled: s.registrationEnabled,
    paymentMode: s.paymentMode,
    currency: s.currency,
    homepageBannerEnabled: s.homepageBannerEnabled,
    homepageBanner: s.homepageBanner,
    homepageBannerColor: s.homepageBannerColor,
    enableNotifications: s.enableNotifications,
    enableWhatsapp: s.enableWhatsapp,
  };
}

export const DEFAULT_PUBLIC_BUSINESS_SETTINGS: PublicBusinessSettings =
  toPublicBusinessSettings(DEFAULT_BUSINESS_SETTINGS);
