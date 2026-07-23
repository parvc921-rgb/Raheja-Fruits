"use server";

import {
  checkoutSchema,
  type CheckoutInput,
  type Fruit,
  type Customer,
  type OrderLineItem,
} from "@raheja/shared";
import { adminAuth, adminDb, getBusinessSettings } from "@raheja/shared/server";
import { FieldValue } from "firebase-admin/firestore";

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
  error?: string;
  gstNumber?: string; // non-empty only if Business Settings has one set
}

function nextDeliveryDate(now: Date): Date {
  const istNow = new Date(
    now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000
  );

  const delivery = new Date(istNow);
  delivery.setDate(delivery.getDate() + 1);
  delivery.setHours(6, 0, 0, 0);

  return delivery;
}

export async function checkoutAction(
  idToken: string,
  input: CheckoutInput
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Your cart looks empty or invalid. Please refresh and try again.",
    };
  }

  let uid: string;

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (error) {
    console.error("checkoutAction: token verification failed", error);

    return {
      ok: false,
      error: "Your session has expired. Please log in again.",
    };
  }

  const settings = await getBusinessSettings();

  if (settings.maintenanceMode) {
    return {
      ok: false,
      error: settings.maintenanceMessage || "We're temporarily unavailable. Please try again shortly.",
    };
  }

  if (!settings.acceptOrders) {
    return {
      ok: false,
      error: "We're not accepting new orders right now. Please check back soon.",
    };
  }

  const db = adminDb();

  // Generate the next sequential order number, using the admin's
  // configured prefix/starting number. The starting number only takes
  // effect the very first time (counter doc doesn't exist yet) — once
  // orders exist, later changes to invoiceStartingNumber intentionally
  // don't renumber or jump the sequence, to avoid ever colliding with
  // or skipping over an already-active counter.
  const counterRef = db.collection("counters").doc("orders");

  const orderNumber = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let current = settings.invoiceStartingNumber - 1;

    if (counterDoc.exists) {
      current = counterDoc.data()?.current ?? current;
    }

    const next = current + 1;

    transaction.set(
      counterRef,
      { current: next },
      { merge: true }
    );

    return `${settings.invoicePrefix}-${next.toString().padStart(6, "0")}`;
  });

  const customerSnap = await db.collection("customers").doc(uid).get();

  if (!customerSnap.exists) {
    return {
      ok: false,
      error: "We couldn't find your account. Please log in again.",
    };
  }

  const customer = customerSnap.data() as Customer;

  if (customer.status === "pending") {
    return {
      ok: false,
      error: "Your account is awaiting admin approval. Please check back soon.",
    };
  }

  if (customer.status !== "active") {
    return {
      ok: false,
      error: "This account isn't active. Contact Raheja Fruits support.",
    };
  }

  const fruitIds = parsed.data.items.map((i) => i.fruitId);

  const fruitDocs = await db.getAll(
    ...fruitIds.map((id) => db.collection("fruits").doc(id))
  );

  const orderItems: OrderLineItem[] = [];
  const unavailable: string[] = [];

  parsed.data.items.forEach((cartItem, index) => {
    const fruitDoc = fruitDocs[index];

    if (!fruitDoc.exists) {
      unavailable.push(cartItem.fruitId);
      return;
    }

    const fruit = fruitDoc.data() as Fruit;

    if (!fruit.isAvailable && !settings.allowOutOfStockOrders) {
      unavailable.push(fruit.name);
      return;
    }

    orderItems.push({
      fruitId: fruitDoc.id,
      name: fruit.name,
      unit: fruit.unit,
      retailPriceAtOrder: fruit.retailPrice,
      memberPriceAtOrder: fruit.memberPrice,
      quantity: cartItem.quantity,
      lineTotal: fruit.memberPrice * cartItem.quantity,
    });
  });

  if (unavailable.length > 0) {
    return {
      ok: false,
      error: `Some items are no longer available: ${unavailable.join(", ")}. Please update your cart.`,
    };
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const totalSavings = orderItems.reduce(
    (sum, item) =>
      sum +
      (item.retailPriceAtOrder - item.memberPriceAtOrder) *
        item.quantity,
    0
  );

  if (subtotal < settings.minimumOrder) {
    return {
      ok: false,
      error: `Your order total is below the ₹${settings.minimumOrder} minimum.`,
    };
  }

  const deliveryCharge =
    subtotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryCharge;
  const total = subtotal + deliveryCharge;

  const orderRef = await db.collection("orders").add({
    orderNumber,
    customerId: uid,
    buildingId: customer.buildingId,
    wing: customer.wing,
    flatNumber: customer.flatNumber,
    items: orderItems,
    subtotal,
    totalSavings,
    deliveryCharge,
    total,
    status: "placed",
    paymentMethod: "cod",
    placedAt: FieldValue.serverTimestamp(),
    deliveryDate: nextDeliveryDate(new Date()),
    deliveryWindow: "06:00-07:00",
    whatsappSentAt: null,
    cancellable: false,
  });

  await db.collection("customers").doc(uid).update({
    lastOrderAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    orderId: orderNumber,
    gstNumber: settings.gstNumber || undefined,
  };
}