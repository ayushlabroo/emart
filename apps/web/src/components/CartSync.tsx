"use client";
// App-wide cart sync. Providers ke andar mount hota hai taaki har page pe navbar
// badge sahi rahe (useCart count store mein daalta hai). Render kuch nahi karta.
import { useCart } from "@/hooks/useCart";

export function CartSync() {
  useCart();
  return null;
}
