// ─── Cart Store (Zustand) ─────────────────────────────────────────────────────
//
// Cart ka actual data TanStack Query manage karega (server se fetch hoga).
// Yahan sirf `count` rakha hai — navbar mein badge dikhane ke liye.
// Jab TanStack Query cart data laaye, uss waqt `setCount` call karenge.

import { create } from "zustand";

interface CartStore {
  count: number;
  setCount: (count: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
