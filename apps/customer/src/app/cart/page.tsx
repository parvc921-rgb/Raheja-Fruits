"use client";

import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useCartStore } from "@/store/cart-store";
import { usePublicBusinessSettings } from "@/lib/business-settings";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { MinOrderProgress } from "@/components/cart/min-order-progress";

export default function CartPage() {
  const { loading } = useRequireAuth();
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const { settings } = usePublicBusinessSettings();

  if (loading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-display text-lg font-medium">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">
          Add a few fruits from today&apos;s catalogue to get started.
        </p>
        <Link
          href="/catalogue"
          className="mt-3 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Browse fruits
        </Link>
      </main>
    );
  }

  const deliveryCharge =
    subtotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryCharge;
  const canCheckout = subtotal >= settings.minimumOrder && settings.acceptOrders;

  return (
    <div className="pb-28">
      <header className="border-b border-border px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <Link href="/catalogue" className="text-sm text-muted-foreground underline">
            ← Continue shopping
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold">Your Cart</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="rounded-lg border border-border bg-card px-3">
          {lines.map((line) => (
            <CartLineItem key={line.fruitId} line={line} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display font-semibold">₹{subtotal}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">You saved</span>
              <span className="font-medium text-accent">₹{totalSavings}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery charge</span>
            <span className="font-medium">
              {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
            </span>
          </div>
          {deliveryCharge > 0 && settings.freeDeliveryAbove > subtotal && (
            <p className="text-xs text-muted-foreground">
              Add ₹{settings.freeDeliveryAbove - subtotal} more for free delivery
            </p>
          )}
          <MinOrderProgress subtotal={subtotal} minimumOrder={settings.minimumOrder} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-2xl">
          {!settings.acceptOrders ? (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-md bg-muted py-3 text-center text-sm font-medium text-muted-foreground"
            >
              Not accepting orders right now
            </button>
          ) : canCheckout ? (
            <Link
              href="/checkout"
              className="block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Proceed to checkout · ₹{subtotal + deliveryCharge}
            </Link>
          ) : (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-md bg-muted py-3 text-center text-sm font-medium text-muted-foreground"
            >
              Add ₹{settings.minimumOrder - subtotal} more to checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
