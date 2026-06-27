// ─── Payment API layer ────────────────────────────────────────────────────────
import api from "@/lib/axios";

// create-order ka response → Razorpay checkout dialog kholne ke liye chahiye.
// keyId frontend pe public-safe hai (key_id), secret kabhi client pe nahi aata.
export interface CreatePaymentResponse {
  razorpayOrderId: string;
  amount: number; // paise mein
  currency: string;
  keyId: string;
}

// Razorpay checkout success callback ke baad yeh teen cheezein verify ko bhejte hain.
export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

type ApiOk<T> = { success: true; data: T };

export async function createPaymentOrder(
  orderId: string,
): Promise<CreatePaymentResponse> {
  const { data } = await api.post<ApiOk<CreatePaymentResponse>>(
    "/payments/create-order",
    { orderId },
  );
  return data.data;
}

export async function verifyPayment(
  input: VerifyPaymentInput,
): Promise<{ status: string }> {
  const { data } = await api.post<ApiOk<{ status: string }>>(
    "/payments/verify",
    input,
  );
  return data.data;
}
