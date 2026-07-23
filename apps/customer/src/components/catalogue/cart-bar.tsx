"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { usePublicBusinessSettings } from "@/lib/business-settings";

export function CartBar() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const { settings } = usePublicBusinessSettings();

  if (lines.length === 0) return null;

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const remaining = settings.minimumOrder - subtotal;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {itemCount} {itemCount === 1 ? "item" : "items"} · ₹{subtotal}
          </p>
          {remaining > 0 ? (
            <p className="text-xs text-muted-foreground">
              Add ₹{remaining} more to reach the ₹{settings.minimumOrder} minimum
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Minimum order reached</p>
          )}
        </div>
        <Link
          href="/cart"
          className="shrink-0 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
