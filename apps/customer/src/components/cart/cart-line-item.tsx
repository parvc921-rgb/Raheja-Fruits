"use client";

import { useCartStore, type CartLine } from "@/store/cart-store";

export function CartLineItem({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lineTotal = line.memberPrice * line.quantity;

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{line.name}</p>
        <p className="text-xs text-muted-foreground">
          ₹{line.memberPrice} / {line.unit}
        </p>
      </div>

      <div className="flex items-center rounded-md border border-primary">
        <button
          onClick={() => setQuantity(line.fruitId, line.quantity - 1)}
          aria-label={`Remove one ${line.name}`}
          className="px-2.5 py-1.5 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center font-display text-sm font-semibold" aria-live="polite">
          {line.quantity}
        </span>
        <button
          onClick={() => setQuantity(line.fruitId, line.quantity + 1)}
          aria-label={`Add one more ${line.name}`}
          className="px-2.5 py-1.5 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          +
        </button>
      </div>

      <p className="w-14 shrink-0 text-right font-display text-sm font-semibold">
        ₹{lineTotal}
      </p>

      <button
        onClick={() => removeItem(line.fruitId)}
        aria-label={`Remove ${line.name} from cart`}
        className="shrink-0 text-muted-foreground hover:text-berry focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        ✕
      </button>
    </div>
  );
}
