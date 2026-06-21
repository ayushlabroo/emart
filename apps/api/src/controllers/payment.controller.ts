// apps/api/src/controllers/payment.controller.ts
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { prisma } from "@emart/database";
import { PaymentStatus } from "@emart/types";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/app-error";
import type { CreatePaymentOrderInput, VerifyPaymentInput } from "../validators/payment";

// Razorpay SDK ka singleton instance.
// 'new Razorpay(...)' ek HTTP client banata hai — baar baar banana wasteful hai.
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

async function getCustomerId(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer) throw new AppError("Customer profile nahi mila", 404, "NOT_FOUND");
  return customer.id;
}

// ─── POST /payments/create-order ──────────────────────────────────────────────
//
// Flow:
//  1. Order fetch + ownership verify
//  2. Already paid? → error
//  3. PENDING payment already exists (user refreshed page)? → same razorpay_order_id return karo (idempotent)
//  4. Failed/no payment? → new Razorpay order banao + Payment record upsert
//  5. Frontend ko { razorpayOrderId, amount, currency, keyId } return karo
//
// Frontend yeh data leke Razorpay checkout dialog kholega.
// keyId frontend pe publicly safe hai — secret key kabhi client ko mat bhejo.

export async function createPaymentOrder(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const { orderId } = req.body as CreatePaymentOrderInput;

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    select: {
      id: true,
      total: true,
      paymentStatus: true,
      payment: { select: { razorpayOrderId: true, status: true } },
    },
  });
  if (!order) throw new AppError("Order nahi mila", 404, "NOT_FOUND");

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new AppError("Is order ka payment pehle se ho chuka hai", 400, "PAYMENT_ALREADY_DONE");
  }

  // Idempotency guard: agar customer ne page refresh kiya aur dobara /create-order hit kiya,
  // naya Razorpay order mat banao — pehle wala hi wapas do.
  // Razorpay har order ID ke liye alag checkout kholega, toh duplicate avoid hota hai.
  if (order.payment?.status === PaymentStatus.PENDING) {
    const amountInPaise = Math.round(Number(order.total) * 100);
    return res.json({
      success: true,
      data: {
        razorpayOrderId: order.payment.razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  }

  // Razorpay ke server pe order banao.
  // amount = paise mein (₹1 = 100 paise). Math.round() floating point errors se bachata hai.
  const amountInPaise = Math.round(Number(order.total) * 100);
  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: order.id, // tumhara internal ID — Razorpay dashboard mein dikhta hai
  });

  // Upsert: payment exist kare (FAILED case = retry) toh update, nahi kare toh create.
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      status: PaymentStatus.PENDING,
    },
    update: {
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      status: PaymentStatus.PENDING,
      razorpayPaymentId: null, // purani failed payment ki details clear karo
      razorpaySignature: null,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
    },
  });
}

// ─── POST /payments/verify ─────────────────────────────────────────────────────
//
// Frontend callback: Razorpay checkout complete hone ke baad frontend yeh call karta hai.
// Teen cheezein bhejta hai: razorpayOrderId, razorpayPaymentId, razorpaySignature.
//
// Signature verification:
//   expected = HMAC-SHA256(key=KEY_SECRET, data="orderId|paymentId")
//   agar expected === razorpaySignature → payment genuine hai
//
// Yeh verify karna ZAROORI hai — bina verify ke koi bhi fake request bhej ke
// orders ko PAID mark kar sakta hai.

export async function verifyPayment(req: Request, res: Response) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body as VerifyPaymentInput;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
    select: { id: true, orderId: true, status: true },
  });
  if (!payment) throw new AppError("Payment record nahi mila", 404, "NOT_FOUND");

  // Idempotent: already paid? Same response bhejo.
  if (payment.status === PaymentStatus.PAID) {
    return res.json({ success: true, data: { status: PaymentStatus.PAID } });
  }

  // HMAC-SHA256 signature verify
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expected !== razorpaySignature) {
    // Signature galat hai — koi tamper kar raha hai request ke saath.
    // Payment ko FAILED mark karo aur error return karo.
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    throw new AppError(
      "Payment signature verify nahi hua — tampered request",
      400,
      "PAYMENT_INVALID_SIGNATURE",
    );
  }

  // Signature valid — Order aur Payment ek saath update karo ($transaction array form).
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        razorpayPaymentId,
        razorpaySignature,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: PaymentStatus.PAID },
    }),
  ]);

  res.json({ success: true, data: { status: PaymentStatus.PAID } });
}

// ─── POST /payments/webhook ────────────────────────────────────────────────────
//
// Razorpay ka server-to-server event. Koi auth middleware nahi — but Razorpay
// apna HMAC-SHA256 signature header mein bhejta hai (x-razorpay-signature).
//
// Webhook secret ≠ key secret. Dashboard pe alag set karo.
//
// Kyun webhook verify ke liye rawBody chahiye?
// JSON.parse ke baad object ka string representation original bytes se alag ho
// sakta hai (key order, whitespace, encoding). Signature tab hi match karta hai
// jab original bytes use karo — parsed body se NAHI banta.
//
// Idempotency: Razorpay kabhi kabhi same event 2 baar bhejta hai (retry logic).
// Agar already PAID hai toh 200 OK return karo — kuch mat karo.

export async function webhookHandler(req: Request, res: Response) {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  if (!signature) throw new AppError("Webhook signature missing", 400, "VALIDATION_ERROR");

  if (!req.rawBody) throw new AppError("Webhook raw body missing", 400, "VALIDATION_ERROR");

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (expected !== signature) {
    throw new AppError("Webhook signature invalid", 400, "PAYMENT_INVALID_SIGNATURE");
  }

  // Event parse karo — Razorpay bahut saare events bhejta hai
  const event = req.body as {
    event: string;
    payload: { payment: { entity: { id: string; order_id: string } } };
  };

  // Sirf payment.captured handle karo (payment successful)
  if (event.event !== "payment.captured") {
    return res.json({ success: true, data: { ignored: true } });
  }

  const razorpayPaymentId = event.payload.payment.entity.id;
  const razorpayOrderId = event.payload.payment.entity.order_id;

  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
    select: { id: true, orderId: true, status: true },
  });

  // Unknown razorpay order ID (ho sakta hai test event ho) — 200 return karo, error mat do
  if (!payment) return res.json({ success: true, data: { ignored: true } });

  // Idempotent check
  if (payment.status === PaymentStatus.PAID) {
    return res.json({ success: true, data: { status: PaymentStatus.PAID } });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID, razorpayPaymentId },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: PaymentStatus.PAID },
    }),
  ]);

  res.json({ success: true, data: { status: PaymentStatus.PAID } });
}
