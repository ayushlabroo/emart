import { OrderStatus } from "@emart/types";
import { z } from "zod";

// POST /orders — checkout ke liye sirf delivery address chahiye
// Cart items DB se automatically aate hain (client trust nahi karte)
export const placeOrderSchema = z.object({
  addressId: z.string().cuid("Invalid address ID"),
});

// GET /orders — paginated history
export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// PATCH /orders/:id/status — STORE_MANAGER/ADMIN ke liye
export const updateStatusSchema = z.object({
  // z.nativeEnum = TypeScript enum ko Zod schema mein convert karo
  // sirf valid OrderStatus values accept karega, baaki reject
  status: z.nativeEnum(OrderStatus),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
