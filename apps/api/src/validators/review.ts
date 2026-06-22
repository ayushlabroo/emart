// apps/api/src/validators/review.ts
import { z } from "zod";

const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createReviewSchema = z.object({
  articleId: z.string().min(1, "articleId zaroori hai"),
  rating:    z.number().int().min(1).max(5, "Rating 1 se 5 ke beech honi chahiye"),
  comment:   z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
  rating:  z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
}).refine(
  (d) => d.rating !== undefined || d.comment !== undefined,
  { message: "rating ya comment mein se kuch toh bhejo" },
);

export const reviewQuerySchema = paginationSchema;

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewQuery       = z.infer<typeof reviewQuerySchema>;
