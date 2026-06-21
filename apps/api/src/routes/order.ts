// apps/api/src/routes/order.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import { getOrder, listOrders, placeOrder } from "../controllers/order.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { orderQuerySchema, placeOrderSchema } from "../validators/order";

const router: Router = createRouter();

const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];

router.post("/", ...customerOnly, validate(placeOrderSchema), placeOrder);
router.get("/", ...customerOnly, validate(orderQuerySchema, "query"), listOrders);
router.get("/:id", ...customerOnly, getOrder);

export { router as orderRouter };
