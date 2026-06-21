// apps/api/src/routes/address.ts
import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "../controllers/address.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { createAddressSchema, updateAddressSchema } from "../validators/address";

const router: Router = createRouter();

const customerOnly = [authenticate, authorize(UserRole.CUSTOMER)];

router.get("/", ...customerOnly, listAddresses);
router.post("/", ...customerOnly, validate(createAddressSchema), createAddress);
router.patch("/:id", ...customerOnly, validate(updateAddressSchema), updateAddress);
router.patch("/:id/default", ...customerOnly, setDefaultAddress);
router.delete("/:id", ...customerOnly, deleteAddress);

export { router as addressRouter };
