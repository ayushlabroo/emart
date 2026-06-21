import { z } from "zod";

// POST /cart/items — article cart mein daalo
// qty: kitne units chahiye (1–100 ek reasonable cap hai grocery ke liye)
export const addToCartSchema = z.object({
  articleId: z.string().cuid("Invalid article ID"),
  qty: z.number().int("Qty integer hona chahiye").min(1, "Kam se kam 1 chahiye").max(100, "Ek baar mein 100 se zyada nahi"),
});

// PATCH /cart/items/:id — sirf qty change karo
export const updateCartItemSchema = z.object({
  qty: z.number().int("Qty integer hona chahiye").min(1, "Kam se kam 1 chahiye").max(100, "Ek baar mein 100 se zyada nahi"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
