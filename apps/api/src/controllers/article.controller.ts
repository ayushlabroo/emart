// apps/api/src/controllers/article.controller.ts
import { Prisma, prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { isPrismaKnownError } from "../lib/prisma-error";
import type {
  ArticleQuery,
  CreateArticleInput,
  UpdateArticleInput,
} from "../validators/catalog";

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createArticle(req: Request, res: Response) {
  const body = req.body as CreateArticleInput;

  try {
    const article = await prisma.article.create({
      data: body,
      include: {
        subcategory: { select: { id: true, name: true, categoryId: true } },
      },
    });
    res.status(201).json({ success: true, data: { article } });
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2003") {
      // P2003 = diya hua subcategoryId exist nahi karta
      throw new AppError("Subcategory nahi mili", 404, "NOT_FOUND");
    }
    throw err;
  }
}

// ─── LIST (public) ─────────────────────────────────────────────────────────────

export async function listArticles(_req: Request, res: Response) {
  const { page, limit, subcategoryId, search } = res.locals["query"] as ArticleQuery;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(subcategoryId ? { subcategoryId } : {}),
    // Prisma ka "contains" — SQL LIKE '%search%' jaisa kaam karta hai
    // mode: "insensitive" — PostgreSQL mein case-insensitive match (MySQL mein default hi hota)
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        subcategory: { select: { id: true, name: true, categoryId: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── GET BY ID (public) ────────────────────────────────────────────────────────

export async function getArticleById(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      subcategory: {
        select: {
          id: true,
          name: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!article || !article.isActive) {
    throw new AppError("Article nahi mila", 404, "NOT_FOUND");
  }

  res.json({ success: true, data: { article } });
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateArticle(req: Request, res: Response) {
  const id = req.params["id"] as string;
  const body = req.body as UpdateArticleInput;

  try {
    const article = await prisma.article.update({
      where: { id },
      // Prisma PATCH mein subcategoryId aur relation object dono ho sakti hain — TypeScript
      // dono ke beech choose nahi kar paata. UncheckedUpdateInput se directly FK pass hota hai.
      data: body as Prisma.ArticleUncheckedUpdateInput,
      include: {
        subcategory: { select: { id: true, name: true, categoryId: true } },
      },
    });
    res.json({ success: true, data: { article } });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      if (err.code === "P2025") {
        throw new AppError("Article nahi mila", 404, "NOT_FOUND");
      }
      if (err.code === "P2003") {
        throw new AppError("Subcategory nahi mili", 404, "NOT_FOUND");
      }
    }
    throw err;
  }
}

// ─── DELETE (SOFT) ─────────────────────────────────────────────────────────────
//
// WHY SOFT DELETE?
// Articles order history mein referenced hote hain (OrderItem.articleId).
// Prisma schema mein onDelete: Restrict hai — agar kisi article ka order hai,
// hard delete fail ho jaayega (P2003). Plus, past orders ka data preserve
// karna zaroori hai (legal, accounting).
//
// Solution: isActive = false — article DB mein rehta hai, public list mein nahi aata.
// Zepto/Swiggy yahi karte hain.

export async function deleteArticle(req: Request, res: Response) {
  const id = req.params["id"] as string;

  try {
    await prisma.article.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, data: null });
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2025") {
      throw new AppError("Article nahi mila", 404, "NOT_FOUND");
    }
    throw err;
  }
}
