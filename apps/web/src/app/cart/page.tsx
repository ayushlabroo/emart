"use client";
// /cart — protected. Cart items + qty stepper + subtotal + checkout.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clearCart } from "@/lib/api/cart";
import { useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/format";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/AddToCartButton";

function CartContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useCart();

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) return <Spinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState emoji="🛒" title="Cart khaali hai" subtitle="Kuch add karo na!">
        <Link href="/">
          <Button>Shopping shuru karo</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Items */}
      <div className="space-y-3 lg:col-span-2">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              {item.article.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.article.photo}
                  alt={item.article.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl">🛒</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.articleId}`}
                className="line-clamp-1 text-sm font-medium text-gray-900 hover:text-green-600"
              >
                {item.article.name}
              </Link>
              <span className="text-xs text-gray-400">{item.article.unit}</span>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {formatINR(item.article.price)}
              </div>
            </div>

            {/* Stepper (AddToCartButton cart mein hone pe − qty + dikhata hai) */}
            <AddToCartButton articleId={item.articleId} />

            {/* Line total */}
            <div className="w-20 text-right text-sm font-bold text-gray-900">
              {formatINR(Number(item.article.price) * item.qty)}
            </div>
          </div>
        ))}

        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
        >
          Cart khaali karo
        </button>
      </div>

      {/* Summary */}
      <div className="h-fit rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Bill summary</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatINR(cart.subtotal)}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-gray-500">Delivery</span>
          <span className="font-medium text-green-600">FREE</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-base font-bold">
          <span>Total</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>

        <Button
          className="mt-5 w-full"
          onClick={() => router.push("/checkout")}
        >
          Checkout
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <PageShell>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tumhara Cart</h1>
      <RequireAuth>
        <CartContent />
      </RequireAuth>
    </PageShell>
  );
}
