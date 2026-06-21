import { z } from "zod";

// Pincode field — India ke 6-digit numeric pincodes ke liye
const pincodeField = z
  .string()
  .length(6, "Pincode 6 digits ka hona chahiye")
  .regex(/^\d{6}$/, "Pincode sirf numbers hone chahiye");

// ─── Store schemas ─────────────────────────────────────────────────────────────

export const createStoreSchema = z.object({
  name: z.string().min(2, "Name kam se kam 2 characters").max(100, "Name 100 characters se zyada nahi"),
  pincode: pincodeField,
  managerId: z.string().cuid("Invalid manager ID").optional(),
});

export const updateStoreSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    pincode: pincodeField.optional(),
    // null = manager unassign karo. string = naya manager assign karo.
    managerId: z.string().cuid("Invalid manager ID").nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Kuch toh update karo" });

// ─── Inventory schemas ─────────────────────────────────────────────────────────

export const upsertInventorySchema = z.object({
  articleId: z.string().cuid("Invalid article ID"),
  // stock absolute value hai (relative increment nahi) — "set stock to X"
  stock: z.number().int("Stock pura number hona chahiye").min(0, "Stock negative nahi ho sakta"),
});

// ─── Query schemas ─────────────────────────────────────────────────────────────

export const storeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  pincode: pincodeField.optional(),
  // URL string "true"/"false" → JS boolean
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Inferred types ────────────────────────────────────────────────────────────

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type UpsertInventoryInput = z.infer<typeof upsertInventorySchema>;
export type StoreQuery = z.infer<typeof storeQuerySchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
