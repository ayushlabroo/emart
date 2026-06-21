// apps/api/src/routes/order.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  cancelOrder,
  getOrder,
  listOrders,
  placeOrder,
  requestReturn,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { orderQuerySchema, placeOrderSchema, updateStatusSchema } from "../validators/order";

const router: Router = createRouter();

const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];
const staffOnly = [authenticate, authorize(UserRole.STORE_MANAGER, UserRole.ADMIN)];

// ── Core order flow ────────────────────────────────────────────────────────────
router.post("/", ...customerOnly, validate(placeOrderSchema), placeOrder);
router.get("/", ...customerOnly, validate(orderQuerySchema, "query"), listOrders);
router.get("/:id", ...customerOnly, getOrder);

// ── Status management ─────────────────────────────────────────────────────────
router.patch("/:id/status", ...staffOnly, validate(updateStatusSchema), updateOrderStatus);
router.post("/:id/cancel", ...customerOnly, cancelOrder);
router.post("/:id/return", ...customerOnly, requestReturn);

export { router as orderRouter };
