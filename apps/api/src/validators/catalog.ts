// apps/api/src/validators/catalog.ts
import { z } from "zod";

// ─── Shared helpers ────────────────────────────────────────────────────────────

// Pagination query — har list endpoint mein yahi use hoga
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Units enum — Prisma schema ke Units enum se exactly match karna chahiye
const UNITS = ["KG", "EA", "L", "G", "ML"] as const;

// ─── Category ──────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Naam zaroori hai").max(100),
  // photo ek URL string hai — upload step baad mein aayega, abhi URL directly denge
  photo: z.string().url("Photo ka sahi URL daalo").optional(),
});

// .partial() — createCategorySchema ke sare fields optional kar deta hai
// Matlab PATCH mein client sirf wahi field bheje jo update karni hai
export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({
    isActive: z.boolean().optional(), // ADMIN category band/chalu kar sake
  });

export const categoryQuerySchema = paginationSchema;

// ─── Subcategory ───────────────────────────────────────────────────────────────

export const createSubcategorySchema = z.object({
  name: z.string().min(1, "Naam zaroori hai").max(100),
  categoryId: z.string().min(1, "categoryId zaroori hai"),
  photo: z.string().url("Photo ka sahi URL daalo").optional(),
});

export const updateSubcategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  photo: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const subcategoryQuerySchema = paginationSchema.extend({
  // Optional filter: /subcategories?categoryId=abc123 → sirf us category ki subcategories
  categoryId: z.string().optional(),
});

// ─── Article ───────────────────────────────────────────────────────────────────

export const createArticleSchema = z.object({
  name: z.string().min(1, "Article naam zaroori hai").max(200),
  description: z.string().max(1000).optional(),
  photo: z.string().url("Photo ka sahi URL daalo").optional(),
  mrp: z.number().positive("MRP positive hona chahiye"),
  price: z.number().positive("Price positive hona chahiye"),
  unit: z.enum(UNITS, { error: "Sahi unit daalo: KG, EA, L, G, ML" }),
  discount: z.number().min(0).max(100).default(0),
  subcategoryId: z.string().min(1, "subcategoryId zaroori hai"),
  // attributes — flexible JSON, e.g. { expiryDays: 180 } grocery ke liye
  // Zod v4 mein z.record() ko 2 args chahiye: z.record(keyType, valueType)
  attributes: z.record(z.string(), z.any()).optional(),
});

// PATCH ke liye: sab optional, lekin subcategoryId change allowed hai (article move)
export const updateArticleSchema = createArticleSchema.partial();

export const articleQuerySchema = paginationSchema.extend({
  subcategoryId: z.string().optional(),
  // search — article naam mein substring search
  search: z.string().max(100).optional(),
});

// ─── Inferred Types ────────────────────────────────────────────────────────────
// Zod schema se TypeScript type nikaalte hain — ek hi jagah define hota hai

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;

export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;
export type SubcategoryQuery = z.infer<typeof subcategoryQuerySchema>;

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleQuery = z.infer<typeof articleQuerySchema>;
