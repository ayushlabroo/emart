"use client";
// ─── useCart hook ─────────────────────────────────────────────────────────────
// Cart data ek hi jagah se aaye — yeh hook useQuery wrap karta hai aur saath hi
// navbar badge ke liye cart store ka `count` sync karta hai.
//
// IMPORTANT: cart CUSTOMER-only route hai. Logged-out user pe query chalu hui toh
// 401 → interceptor refresh try karega → fail → /login redirect (public page pe
// bura UX). Isliye `enabled: !!user` — logged-in hone par hi fetch karo.
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/lib/api/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useCartStore } from "@/lib/store/cart";

export function useCart() {
  const user = useAuthStore((s) => s.user);
  const setCount = useCartStore((s) => s.setCount);

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user, // logged out → query disabled, koi network call nahi
  });

  // Jab bhi cart data badle, total item count store mein daal do (badge ke liye)
  useEffect(() => {
    if (query.data) {
      const count = query.data.items.reduce((sum, item) => sum + item.qty, 0);
      setCount(count);
    } else if (!user) {
      setCount(0); // logout pe badge clear
    }
  }, [query.data, user, setCount]);

  return query;
}
