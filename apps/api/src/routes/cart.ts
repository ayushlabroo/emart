// apps/api/src/routes/cart.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { addToCartSchema, updateCartItemSchema } from "../validators/cart";

const router: Router = createRouter();

// Saare cart routes CUSTOMER-only hain — koi bhi public read nahi
const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];

router.get("/", ...customerOnly, getCart);
router.post("/items", ...customerOnly, validate(addToCartSchema), addToCart);
router.patch("/items/:id", ...customerOnly, validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:id", ...customerOnly, removeCartItem);
router.delete("/", ...customerOnly, clearCart);

export { router as cartRouter };
