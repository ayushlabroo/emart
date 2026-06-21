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

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
