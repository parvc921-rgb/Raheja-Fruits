"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  fruitId: string;
  name: string;
  unit: string;
  retailPrice: number;
  memberPrice: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (fruitId: string) => void;
  setQuantity: (fruitId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalSavings: () => number;
}

// Cart lives in localStorage (via zustand persist), not Firestore, until
// checkout — keeps browsing/cart-building free of write costs and fast
// even offline. Prices shown here are for UX only; the checkout Server
// Action re-prices everything from the live `fruits` collection.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addItem: (item, quantity = 1) => {
        const existing = get().lines.find((l) => l.fruitId === item.fruitId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.fruitId === item.fruitId
                ? { ...l, quantity: l.quantity + quantity }
                : l
            ),
          });
        } else {
          set({ lines: [...get().lines, { ...item, quantity }] });
        }
      },

      removeItem: (fruitId) =>
        set({ lines: get().lines.filter((l) => l.fruitId !== fruitId) }),

      setQuantity: (fruitId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(fruitId);
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.fruitId === fruitId ? { ...l, quantity } : l
          ),
        });
      },

      clear: () => set({ lines: [] }),

      subtotal: () =>
        get().lines.reduce((sum, l) => sum + l.memberPrice * l.quantity, 0),

      totalSavings: () =>
        get().lines.reduce(
          (sum, l) => sum + (l.retailPrice - l.memberPrice) * l.quantity,
          0
        ),
    }),
    { name: "raheja-fruits-cart" }
  )
);
