// apps/api/src/controllers/review.controller.ts
import { prisma } from "@emart/database";
import { OrderStatus } from "@emart/types";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { isPrismaKnownError } from "../lib/prisma-error";
import type {
  CreateReviewInput,
  ReviewQuery,
  UpdateReviewInput,
} from "../validators/review";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCustomerId(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer) throw new AppError("Customer profile nahi mila", 404, "NOT_FOUND");
  return customer.id;
}

// Har review change ke baad Article ka avgRating + reviewCount fresh calculate karo.
// $transaction ke andar call hota hai isliye `tx` pass karte hain.
async function recalculateRating(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  articleId: string,
) {
  const agg = await tx.review.aggregate({
    where: { articleId },
    _avg:   { rating: true },
    _count: { rating: true },
  });

  await tx.article.update({
    where: { id: articleId },
    data: {
      avgRating:   agg._avg.rating   ?? 0,
      reviewCount: agg._count.rating,
    },
  });
}

// ─── POST /reviews ─────────────────────────────────────────────────────────────

export async function createReview(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const { articleId, rating, comment } = req.body as CreateReviewInput;

  // Purchase check: customer ke kisi DELIVERED order mein yeh article hona chahiye
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      articleId,
      order: {
        customerId,
        status: OrderStatus.DELIVERED,
      },
    },
    select: { id: true },
  });

  if (!hasPurchased) {
    throw new AppError(
      "Sirf kharida hua article review kar sakte ho",
      403,
      "NOT_PURCHASED",
    );
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { customerId, articleId, rating, comment },
        include: {
          customer: { select: { name: true } },
        },
      });
      await recalculateRating(tx, articleId);
      return created;
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    // P2002 = unique constraint violation → yeh customer pehle se review kar chuka hai
    if (isPrismaKnownError(err) && err.code === "P2002") {
      throw new AppError("Tumne pehle se is article ka review diya hua hai", 409, "ALREADY_REVIEWED");
    }
    throw err;
  }
}

// ─── GET /reviews/articles/:articleId ─────────────────────────────────────────

export async function listReviewsForArticle(req: Request, res: Response) {
  const articleId = req.params["articleId"] as string;
  const { page, limit } = res.locals["query"] as ReviewQuery;
  const skip = (page - 1) * limit;

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { articleId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
      },
    }),
    prisma.review.count({ where: { articleId } }),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

// ─── PATCH /reviews/:id ────────────────────────────────────────────────────────

export async function updateReview(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const reviewId = req.params["id"] as string;
  const { rating, comment } = req.body as UpdateReviewInput;

  // Ownership check: sirf apna review edit kar sako
  const existing = await prisma.review.findFirst({
    where: { id: reviewId, customerId },
    select: { id: true, articleId: true },
  });
  if (!existing) throw new AppError("Review nahi mila", 404, "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...(rating  !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: { customer: { select: { name: true } } },
    });
    await recalculateRating(tx, existing.articleId);
    return result;
  });

  res.json({ success: true, data: updated });
}

// ─── DELETE /reviews/:id ───────────────────────────────────────────────────────

export async function deleteReview(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const reviewId = req.params["id"] as string;

  // Ownership check via deleteMany — count === 0 matlab review nahi mila
  const existing = await prisma.review.findFirst({
    where: { id: reviewId, customerId },
    select: { articleId: true },
  });
  if (!existing) throw new AppError("Review nahi mila", 404, "NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recalculateRating(tx, existing.articleId);
  });

  res.json({ success: true, data: null });
}
