"use client";
// ─── AddToCartButton ──────────────────────────────────────────────────────────
// Zepto/Blinkit style stepper. Pehli baar `useMutation` use ho raha hai.
//
// useQuery = data PADHNA (GET). useMutation = data BADALNA (POST/PATCH/DELETE).
// useMutation deta hai: mutate() function + isPending (chal raha hai) state.
// onSuccess mein cart query INVALIDATE karte hain → React Query usse "stale" maan
// ke dobara fetch karta hai → UI + navbar badge automatically fresh ho jaate hain.
//
// Logged-out user: button /login pe bhej deta hai (cart auth-only hai).
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addToCart,
  updateCartItem,
  removeCartItem,
} from "@/lib/api/cart";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function AddToCartButton({
  articleId,
  className,
}: {
  articleId: string;
  className?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: cart } = useCart();

  // Cart mein yeh article pehle se hai? qty nikaalo (warna 0)
  const item = cart?.items.find((i) => i.articleId === articleId);
  const qty = item?.qty ?? 0;

  const mutation = useMutation({
    // newQty = naya total qty jo chahiye. 0 → item hatao.
    // async/void return — teeno branches ka return type uniform rakhne ke liye.
    mutationFn: async (newQty: number) => {
      if (newQty <= 0 && item) {
        await removeCartItem(item.id);
        return;
      }
      if (item) {
        await updateCartItem(item.id, newQty);
        return;
      }
      await addToCart(articleId, newQty);
    },
    // Cart cache ko stale mark karo → auto refetch → badge + stepper update
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  // Logged out → cart se pehle login
  if (!user) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={() => router.push("/login")}
      >
        Add
      </Button>
    );
  }

  // Cart mein nahi hai → simple "Add" button
  if (qty === 0) {
    return (
      <Button
        size="sm"
        className={className}
        loading={mutation.isPending}
        onClick={() => mutation.mutate(1)}
      >
        Add
      </Button>
    );
  }

  // Cart mein hai → − qty + stepper
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-green-600 text-white",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Kam karo"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(qty - 1)}
        className="px-3 py-1.5 text-base font-bold disabled:opacity-60"
      >
        −
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Zyada karo"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(qty + 1)}
        className="px-3 py-1.5 text-base font-bold disabled:opacity-60"
      >
        +
      </button>
    </div>
  );
}
