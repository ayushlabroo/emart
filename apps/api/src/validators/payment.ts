// apps/api/src/validators/payment.ts
import { z } from "zod";

// POST /payments/create-order
// Customer batata hai: "is order ka payment karna hai"
export const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, "orderId required"),
});
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

// POST /payments/verify
// Frontend se aata hai Razorpay checkout complete hone ke baad.
// Teen cheezein Razorpay return karta hai — teeno hi signature verify ke liye chahiye.
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "razorpayOrderId required"),
  razorpayPaymentId: z.string().min(1, "razorpayPaymentId required"),
  razorpaySignature: z.string().min(1, "razorpaySignature required"),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
