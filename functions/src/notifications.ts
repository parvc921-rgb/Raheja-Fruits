import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendWhatsAppTemplate } from "./lib/whatsapp";
import type { Order, Customer } from "@raheja/shared";

const db = () => getFirestore();

// The template name/params here match the starting definition in the
// README's WhatsApp setup section — update both together if the
// approved template's body text changes shape.
const ORDER_CONFIRMATION_TEMPLATE = "order_confirmation";

function summarizeItems(order: Order): string {
  const summary = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ");

  // WhatsApp template params are single-line and have a practical length
  // ceiling; trim rather than let a large order blow past it.
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
}

/**
 * onOrderCreated — fires when the customer app's checkout Server Action
 * writes a new `orders` doc. Sends the WhatsApp order confirmation and
 * records `whatsappSentAt`. See architecture doc §6.5.
 *
 * Deliberately does not throw on failure: a failed notification
 * shouldn't retry-storm the trigger or block anything else. The
 * customer's order is already placed and confirmed on-screen in the app
 * regardless of whether this message goes out.
 */
export const onOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const order = snap.data() as Order;
    const orderId = event.params.orderId;

    const customerSnap = await db()
      .collection("customers")
      .doc(order.customerId)
      .get();

    if (!customerSnap.exists) {
      console.error(
        `onOrderCreated: customer ${order.customerId} not found for order ${orderId}`
      );
      return;
    }

    const customer = customerSnap.data() as Customer;

    const result = await sendWhatsAppTemplate({
      to: customer.phone,
      templateName: ORDER_CONFIRMATION_TEMPLATE,
      bodyParams: [
  customer.name,
  order.orderNumber ?? event.params.orderId,
  summarizeItems(order),
  String(order.subtotal),
  order.deliveryWindow.replace("-", "–"),
],
    });

    if (!result.ok) {
      console.error(
        `onOrderCreated: WhatsApp send failed for order ${orderId}: ${result.error}`
      );
      return;
    }

    await snap.ref.update({
      whatsappSentAt: FieldValue.serverTimestamp(),
    });
  }
);