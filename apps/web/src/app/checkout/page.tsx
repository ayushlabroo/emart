"use client";
// /checkout — protected. Address chuno (ya naya banao) → order place → Razorpay pay.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAddresses,
  createAddress,
  type CreateAddressInput,
} from "@/lib/api/address";
import { placeOrder } from "@/lib/api/order";
import { getErrorMessage } from "@/lib/api/error";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { usePayment } from "@/hooks/usePayment";
import { cn } from "@/lib/cn";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function CheckoutContent() {
  const queryClient = useQueryClient();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { pay, paying, error: payError } = usePayment();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });

  // Addresses load hone pe default address apne aap select karo (ek baar)
  useEffect(() => {
    if (selectedId === null && addressesQuery.data && addressesQuery.data.length > 0) {
      const def =
        addressesQuery.data.find((a) => a.isDefault) ?? addressesQuery.data[0];
      setSelectedId(def.id);
    }
  }, [addressesQuery.data, selectedId]);

  // Order place → cart clear (backend) → turant payment shuru
  const placeMutation = useMutation({
    mutationFn: () => placeOrder(selectedId as string),
    onSuccess: (order) => {
      setOrderError(null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      pay(order.id);
    },
    onError: (e) => setOrderError(getErrorMessage(e)),
  });

  if (cartLoading) return <Spinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="Cart khaali hai"
        subtitle="Checkout ke liye pehle kuch add karo."
      >
        <Link href="/">
          <Button>Home</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Address selection */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Delivery address
          </h2>

          {addressesQuery.isLoading ? (
            <Spinner />
          ) : (
            <div className="space-y-3">
              {addressesQuery.data?.map((addr) => (
                <label
                  key={addr.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                    selectedId === addr.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)}
                    className="mt-1 accent-green-600"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{addr.line1}</div>
                    <div className="text-gray-500">
                      {addr.city} — {addr.pincode}
                    </div>
                    {addr.isDefault && (
                      <span className="mt-1 inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                        Default
                      </span>
                    )}
                  </div>
                </label>
              ))}

              <AddAddressForm
                onAdded={(addr) => {
                  setSelectedId(addr.id);
                }}
              />
            </div>
          )}
        </section>
      </div>

      {/* Summary + place order */}
      <div className="h-fit rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span className="text-gray-500">
            Items ({cart.items.length})
          </span>
          <span className="font-medium">{formatINR(cart.subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-gray-500">Delivery</span>
          <span className="font-medium text-green-600">FREE</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-base font-bold">
          <span>Total</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>

        {(orderError || payError) && (
          <p className="mt-3 text-sm text-red-600">{orderError || payError}</p>
        )}

        <Button
          className="mt-5 w-full"
          disabled={!selectedId}
          loading={placeMutation.isPending || paying}
          onClick={() => placeMutation.mutate()}
        >
          Place order &amp; pay
        </Button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Razorpay test mode — koi asli paisa nahi katega
        </p>
      </div>
    </div>
  );
}

// ─── AddAddressForm ───────────────────────────────────────────────────────────
function AddAddressForm({ onAdded }: { onAdded: (addr: { id: string }) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateAddressInput>({
    line1: "",
    city: "",
    pincode: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => createAddress(form),
    onSuccess: (addr) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setForm({ line1: "", city: "", pincode: "" });
      setOpen(false);
      onAdded(addr);
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-gray-300 p-3 text-sm font-medium text-gray-600 hover:border-green-400 hover:text-green-600"
      >
        + Naya address
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <input
        value={form.line1}
        onChange={(e) => setForm({ ...form, line1: e.target.value })}
        placeholder="House / street (min 5 chars)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-3">
        <input
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="City"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          placeholder="Pincode (6 digits)"
          maxLength={6}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PageShell>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>
      <RequireAuth>
        <CheckoutContent />
      </RequireAuth>
    </PageShell>
  );
}
