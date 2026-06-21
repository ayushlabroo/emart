// apps/api/src/controllers/category.controller.ts
import { prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { isPrismaKnownError } from "../lib/prisma-error";
import type { CategoryQuery, CreateCategoryInput, UpdateCategoryInput } from "../validators/catalog";

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createCategory(req: Request, res: Response) {
  const body = req.body as CreateCategoryInput;

  try {
    const category = await prisma.category.create({ data: body });
    res.status(201).json({ success: true, data: { category } });
  } catch (err) {
    // P2002 = unique constraint fail — same name wali category pehle se hai
    if (isPrismaKnownError(err) && err.code === "P2002") {
      throw new AppError("Is naam ki category pehle se hai", 409, "VALIDATION_ERROR");
    }
    throw err;
  }
}

// ─── LIST (public) ─────────────────────────────────────────────────────────────

export async function listCategories(_req: Request, res: Response) {
  // validate("query") middleware ne res.locals["query"] mein parsed data store kiya hai
  const { page, limit } = res.locals["query"] as CategoryQuery;

  const skip = (page - 1) * limit; // offset calculate karo

  // Promise.all — dono queries parallel chalaao (faster!)
  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true }, // public mein sirf active categories
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.category.count({ where: { isActive: true } }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── GET BY ID (public) ────────────────────────────────────────────────────────

export async function getCategoryById(req: Request, res: Response) {
  // req.params.id — URL mein :id placeholder ki value
  // e.g. GET /categories/clxyz123 → req.params.id = "clxyz123"
  // Express 5 mein req.params[key] ka type string | string[] hai — string assert karo
  const id = req.params["id"] as string;

  const category = await prisma.category.findUnique({ where: { id } });

  if (!category || !category.isActive) {
    throw new AppError("Category nahi mili", 404, "NOT_FOUND");
  }

  res.json({ success: true, data: { category } });
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateCategory(req: Request, res: Response) {
  // Express 5 mein req.params[key] ka type string | string[] hai — string assert karo
  const id = req.params["id"] as string;
  const body = req.body as UpdateCategoryInput;

  try {
    const category = await prisma.category.update({ where: { id }, data: body });
    res.json({ success: true, data: { category } });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      if (err.code === "P2025") {
        // P2025 = record not found — galat id diya
        throw new AppError("Category nahi mili", 404, "NOT_FOUND");
      }
      if (err.code === "P2002") {
        throw new AppError("Is naam ki category pehle se hai", 409, "VALIDATION_ERROR");
      }
    }
    throw err;
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteCategory(req: Request, res: Response) {
  // Express 5 mein req.params[key] ka type string | string[] hai — string assert karo
  const id = req.params["id"] as string;

  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      if (err.code === "P2025") {
        throw new AppError("Category nahi mili", 404, "NOT_FOUND");
      }
      // P2003 = foreign key constraint — is category mein subcategories hain
      // Prisma schema mein onDelete: Restrict hai, toh child records honge toh delete block ho jaata hai
      if (err.code === "P2003") {
        throw new AppError(
          "Pehle is category ki sabhi subcategories delete karo",
          409,
          "VALIDATION_ERROR",
        );
      }
    }
    throw err;
  }
}
