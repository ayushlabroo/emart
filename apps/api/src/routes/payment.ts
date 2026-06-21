// apps/api/src/routes/payment.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  webhookHandler,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createPaymentOrderSchema, verifyPaymentSchema } from "../validators/payment";

const router: Router = createRouter();

const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];

// Webhook: no auth — Razorpay directly calls this.
// Webhook route PEHLE aana chahiye, warna rate limiter / auth middleware block kar sakta hai.
router.post("/webhook", webhookHandler);

// Customer routes
router.post("/create-order", ...customerOnly, validate(createPaymentOrderSchema), createPaymentOrder);
router.post("/verify", ...customerOnly, validate(verifyPaymentSchema), verifyPayment);

export { router as paymentRouter };
