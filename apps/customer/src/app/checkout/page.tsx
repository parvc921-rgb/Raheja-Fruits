"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/hooks/use-auth";
import { useBuilding } from "@/lib/buildings";
import { useCartStore } from "@/store/cart-store";
import { checkoutAction } from "@/actions/checkout";
import { auth } from "@/lib/firebase/client";
import { usePublicBusinessSettings } from "@/lib/business-settings";

export default function CheckoutPage() {
  const { loading: authLoading } = useRequireAuth();
  const { profile } = useAuth();
  const { building } = useBuilding(profile?.buildingId);
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const { settings } = usePublicBusinessSettings();
  const deliveryCharge =
    subtotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryCharge;
  const total = subtotal + deliveryCharge;
  const clearCart = useCartStore((s) => s.clear);
  const router = useRouter();

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Loading…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-display text-lg font-medium">
          Your cart is empty
        </p>

        <Link
          href="/catalogue"
          className="mt-2 text-sm font-medium text-primary underline"
        >
          Browse fruits
        </Link>
      </main>
    );
  }

  const handleConfirm = async () => {
    if (!acknowledged || !auth.currentUser) return;

    setError(null);
    setSubmitting(true);

    try {
      const idToken = await auth.currentUser.getIdToken(true);

      const result = await checkoutAction(idToken, {
        items: lines.map((l) => ({
          fruitId: l.fruitId,
          quantity: l.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error ?? "Couldn't place your order. Please try again.");
        return;
      }

      // Create WhatsApp message
      const customerName = profile?.name ?? "";
      const buildingName = building?.name ?? "";
      const wing = profile?.wing ?? "";
      const flat = profile?.flatNumber ?? "";

      const orderLines = lines
        .map(
          (item) =>
            `• ${item.name} × ${item.quantity} ${item.unit} - ₹${item.memberPrice * item.quantity}`
        )
        .join("\n");

      const message = `🍎 *RAHEJA FRUITS*

🆔 Order ID
${result.orderId}

👤 Customer
${customerName}

🏢 Address
${buildingName}
Wing ${wing}
Flat ${flat}

━━━━━━━━━━━━━━

🛒 ITEMS

${orderLines}

━━━━━━━━━━━━━━

💰 Subtotal: ₹${subtotal}
🚛 Delivery: ${deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
💵 Savings: ₹${totalSavings}
🧾 Total: ₹${total}

🚚 Delivery
Tomorrow
6:00 AM - 7:00 AM

💳 Payment
Cash on Delivery
${result.gstNumber ? `\nGSTIN: ${result.gstNumber}` : ""}
Thank you for ordering from ${settings.storeName}! 🍎`;

      // supportWhatsapp is stored as +91XXXXXXXXXX; wa.me needs digits
      // only. Falls back to the original hardcoded number if the admin
      // hasn't set one yet, so this never silently breaks.
      const whatsappDigits = settings.supportWhatsapp.replace(/\D/g, "") || "919702004250";
      const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;

      clearCart();

      // Both the overall "Enable notifications" toggle and the
      // WhatsApp-specific one have to be on — this is currently the
      // only notification channel actually implemented (Email/SMS/Push
      // have no sending mechanism built yet, so there's nothing for
      // those toggles to gate).
      if (settings.enableNotifications && settings.enableWhatsapp) {
        window.open(whatsappUrl, "_blank");
      }

      // Navigate to Orders page
      router.push(`/orders?placed=${result.orderId}`);
    } catch (err) {
      console.error("checkout failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-32">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/cart"
            className="text-sm text-muted-foreground underline"
          >
            ← Back to cart
          </Link>

          <h1 className="mt-2 font-display text-2xl font-semibold">
            Checkout
          </h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Delivering to
          </h2>

          <p className="mt-1 font-display text-base font-semibold">
            {building?.name ?? "..."}
          </p>

          <p className="text-sm text-muted-foreground">
            Wing {profile?.wing}, Flat {profile?.flatNumber}
          </p>

          <p className="mt-2 text-sm">
            Tomorrow, <span className="font-medium">6:00 – 7:00 AM</span>
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Order summary
          </h2>

          <div className="flex flex-col gap-1.5">
            {lines.map((line) => (
              <div
                key={line.fruitId}
                className="flex justify-between text-sm"
              >
                <span>
                  {line.name} × {line.quantity}
                </span>

                <span className="font-medium">
                  ₹{line.memberPrice * line.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal
              </span>

              <span className="font-display font-semibold">
                ₹{subtotal}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  You saved
                </span>

                <span className="font-medium text-accent">
                  ₹{totalSavings}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Delivery charge
              </span>

              <span className="font-medium">
                {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
              </span>
            </div>

            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="font-medium">Total</span>
              <span className="font-display font-semibold">₹{total}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Payment
          </h2>

          <p className="mt-1 text-sm">
            {settings.paymentMode === "cod"
              ? "Pay on Delivery"
              : settings.paymentMode === "online"
                ? "Online payment (coming soon) — Pay on Delivery for now"
                : "Pay on Delivery, or Online payment (coming soon)"}
          </p>

          <p className="text-xs text-muted-foreground">
            Please keep exact change ready for our delivery staff.
          </p>
        </section>

        <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
          />

          <span>
            I understand this order <strong>cannot be cancelled</strong> once
            placed and will be delivered tomorrow between 6:00–7:00 AM.
          </span>
        </label>

        {error && (
          <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={handleConfirm}
            disabled={!acknowledged || submitting || !settings.acceptOrders}
            className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting
              ? "Placing order..."
              : `Place order · ₹${total}`}
          </button>

          {!settings.acceptOrders ? (
            <p className="mt-1 text-center text-xs text-red-600">
              We&apos;re not accepting orders right now. Please check back soon.
            </p>
          ) : subtotal < settings.minimumOrder ? (
            <p className="mt-1 text-center text-xs text-red-600">
              Order total is below the ₹{settings.minimumOrder} minimum.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}