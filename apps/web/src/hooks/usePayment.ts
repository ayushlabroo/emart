"use client";
// ─── usePayment hook ──────────────────────────────────────────────────────────
// Razorpay checkout flow ek jagah — checkout page aur order-detail "Pay Now"
// dono reuse karte hain.
//
// Flow: loadRazorpayScript → createPaymentOrder (backend) → Razorpay dialog open
//       → success handler → verifyPayment (backend HMAC check) → orders refresh.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createPaymentOrder, verifyPayment } from "@/lib/api/payment";
import { getErrorMessage } from "@/lib/api/error";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useAuthStore } from "@/lib/store/auth";

export function usePayment() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(orderId: string) {
    setError(null);
    setPaying(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        throw new Error("Razorpay load nahi hua — internet check karo");
      }

      // Backend Razorpay order banata hai (ya existing PENDING wapas deta hai)
      const data = await createPaymentOrder(orderId);

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "EMart",
        description: "Order payment",
        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
        },
        theme: { color: "#16a34a" },
        // Payment success → signature verify karo, phir order page pe
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
            router.push(`/orders/${orderId}`);
          } catch (e) {
            setError(getErrorMessage(e, "Payment verify nahi hua"));
          } finally {
            setPaying(false);
          }
        },
        // User ne dialog band kar diya bina pay kiye
        modal: { ondismiss: () => setPaying(false) },
      });

      rzp.open();
    } catch (e) {
      setError(getErrorMessage(e, "Payment shuru nahi ho paya"));
      setPaying(false);
    }
  }

  return { pay, paying, error };
}
