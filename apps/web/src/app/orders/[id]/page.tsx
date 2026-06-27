"use client";
// /orders/:id — protected. Order detail + cancel/return + pay-now (agar PENDING).
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, cancelOrder, requestReturn } from "@/lib/api/order";
import { getErrorMessage } from "@/lib/api/error";
import { formatINR } from "@/lib/format";
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/orderStatus";
import { usePayment } from "@/hooks/usePayment";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

function OrderDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { pay, paying, error: payError } = usePayment();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });

  // cancel aur return dono order detail ko refresh karte hain
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const returnMutation = useMutation({
    mutationFn: () => requestReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) return <Spinner />;
  if (!order) return <p className="text-sm text-red-600">Order nahi mila.</p>;

  const meta = ORDER_STATUS_META[order.status];
  const payMeta = PAYMENT_STATUS_META[order.paymentStatus];
  const canCancel = order.status === "PLACED" || order.status === "ACCEPTED";
  const canReturn = order.status === "DELIVERED";
  const canPay =
    order.paymentStatus === "PENDING" &&
    order.status !== "CANCELLED" &&
    order.status !== "RETURNED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-400">
            {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
          >
            {meta.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${payMeta.className}`}
          >
            {payMeta.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo}
                  alt={item.articleName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-xl">🛒</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {item.articleName}
              </div>
              <div className="text-xs text-gray-400">
                {item.unit} × {item.qty}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {formatINR(Number(item.price) * item.qty)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals + address */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm">
          <h3 className="mb-2 font-semibold text-gray-900">Bill</h3>
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          <Row label="Discount" value={`− ${formatINR(order.discount)}`} />
          <Row label="Delivery" value={formatINR(order.deliveryFee)} />
          <Row label="Tax" value={formatINR(order.tax)} />
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-bold">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm">
          <h3 className="mb-2 font-semibold text-gray-900">Delivery address</h3>
          <p className="text-gray-700">{order.deliveryLine1}</p>
          <p className="text-gray-500">
            {order.deliveryCity} — {order.deliveryPincode}
          </p>
        </div>
      </div>

      {payError && <p className="text-sm text-red-600">{payError}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canPay && (
          <Button loading={paying} onClick={() => pay(order.id)}>
            Pay now
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            Cancel order
          </Button>
        )}
        {canReturn && (
          <Button
            variant="outline"
            loading={returnMutation.isPending}
            onClick={() => returnMutation.mutate()}
          >
            Return request
          </Button>
        )}
      </div>

      {(cancelMutation.isError || returnMutation.isError) && (
        <p className="text-sm text-red-600">
          {getErrorMessage(cancelMutation.error ?? returnMutation.error)}
        </p>
      )}

      <Link href="/orders" className="inline-block text-sm text-green-600 hover:underline">
        ← Saare orders
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <PageShell>
      <RequireAuth>
        <OrderDetail id={id} />
      </RequireAuth>
    </PageShell>
  );
}
