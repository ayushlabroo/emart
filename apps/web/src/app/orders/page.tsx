"use client";
// /orders — protected. Order history list. Click → /orders/:id
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/lib/api/order";
import { formatINR } from "@/lib/format";
import { ORDER_STATUS_META } from "@/lib/orderStatus";
import { PageShell } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

function OrdersContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(1),
  });

  if (isLoading) return <Spinner />;

  if (!data || data.orders.length === 0) {
    return (
      <EmptyState
        emoji="📦"
        title="Koi order nahi"
        subtitle="Tumne abhi tak kuch order nahi kiya."
      >
        <Link href="/">
          <Button>Order karo</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {data.orders.map((order) => {
        const meta = ORDER_STATUS_META[order.status];
        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                #{order.id.slice(-8).toUpperCase()}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
              >
                {meta.label}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {order.items.length} item{order.items.length > 1 ? "s" : ""} •{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatINR(order.total)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <PageShell>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tumhare Orders</h1>
      <RequireAuth>
        <OrdersContent />
      </RequireAuth>
    </PageShell>
  );
}
