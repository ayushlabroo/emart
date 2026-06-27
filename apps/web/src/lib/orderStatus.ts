// Order status + payment status ka UI meta (label + Tailwind badge classes).
// Ek jagah define — har page same colors use kare.
import type { OrderStatus, PaymentStatus } from "@/lib/api/order";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PLACED: { label: "Placed", className: "bg-blue-50 text-blue-700" },
  ACCEPTED: { label: "Accepted", className: "bg-indigo-50 text-indigo-700" },
  PICKING: { label: "Picking", className: "bg-amber-50 text-amber-700" },
  PACKED: { label: "Packed", className: "bg-amber-50 text-amber-700" },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    className: "bg-orange-50 text-orange-700",
  },
  DELIVERED: { label: "Delivered", className: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700" },
  RETURN_REQUESTED: {
    label: "Return requested",
    className: "bg-purple-50 text-purple-700",
  },
  RETURNED: { label: "Returned", className: "bg-gray-100 text-gray-700" },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Payment pending", className: "bg-amber-50 text-amber-700" },
  PAID: { label: "Paid", className: "bg-green-50 text-green-700" },
  FAILED: { label: "Payment failed", className: "bg-red-50 text-red-700" },
  REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-700" },
};
