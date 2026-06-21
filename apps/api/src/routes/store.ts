import { UserRole } from "@emart/types";
import { type Router, Router as createRouter } from "express";
import {
  createStore,
  deleteStore,
  getStore,
  listInventory,
  listStores,
  updateStore,
  upsertInventory,
} from "../controllers/store.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createStoreSchema,
  inventoryQuerySchema,
  storeQuerySchema,
  updateStoreSchema,
  upsertInventorySchema,
} from "../validators/store";

const router: Router = createRouter();

const adminOnly = [authenticate, authorize(UserRole.ADMIN)];

// STORE_MANAGER apne store ki inventory manage kar sakta hai, ADMIN kisi bhi store ki
const storeAccess = [authenticate, authorize(UserRole.STORE_MANAGER, UserRole.ADMIN)];

// ── Store CRUD ─────────────────────────────────────────────────────────────────
router.post("/", ...adminOnly, validate(createStoreSchema), createStore);
router.get("/", validate(storeQuerySchema, "query"), listStores);   // public — no auth
router.get("/:id", getStore);                                        // public — no auth
router.patch("/:id", ...adminOnly, validate(updateStoreSchema), updateStore);
router.delete("/:id", ...adminOnly, deleteStore);

// ── Inventory ─────────────────────────────────────────────────────────────────
router.put("/:id/inventory", ...storeAccess, validate(upsertInventorySchema), upsertInventory);
router.get("/:id/inventory", ...storeAccess, validate(inventoryQuerySchema, "query"), listInventory);

export { router as storeRouter };
