"use client";

import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { SavingsStamp } from "./savings-stamp";
import type { Fruit } from "@raheja/shared";

export function FruitCard({ fruit }: { fruit: Fruit }) {
  const quantityInCart =
    useCartStore((s) => s.lines.find((l) => l.fruitId === fruit.id)?.quantity) ?? 0;
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const savings = fruit.retailPrice - fruit.memberPrice;

  const handleAdd = () =>
    addItem(
      {
        fruitId: fruit.id,
        name: fruit.name,
        unit: fruit.unit,
        retailPrice: fruit.retailPrice,
        memberPrice: fruit.memberPrice,
      },
      1
    );

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <SavingsStamp amount={savings} />

      <div className="relative aspect-square w-full bg-muted">
        {fruit.imageUrl ? (
          <Image
            src={fruit.imageUrl}
            alt={fruit.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {fruit.name}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="font-body text-sm font-medium leading-tight">{fruit.name}</h3>
          <p className="text-xs text-muted-foreground">per {fruit.unit}</p>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-primary">
            ₹{fruit.memberPrice}
          </span>
          {savings > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{fruit.retailPrice}
            </span>
          )}
        </div>

        {quantityInCart === 0 ? (
          <button
            onClick={handleAdd}
            className="mt-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Add to cart
          </button>
        ) : (
          <div className="mt-1 flex items-center justify-between rounded-md border border-primary">
            <button
              onClick={() => setQuantity(fruit.id, quantityInCart - 1)}
              aria-label={`Remove one ${fruit.name}`}
              className="px-3 py-2 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              −
            </button>
            <span className="font-display text-sm font-semibold" aria-live="polite">
              {quantityInCart}
            </span>
            <button
              onClick={() => setQuantity(fruit.id, quantityInCart + 1)}
              aria-label={`Add one more ${fruit.name}`}
              className="px-3 py-2 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
