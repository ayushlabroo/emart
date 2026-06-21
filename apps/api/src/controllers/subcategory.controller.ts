// apps/api/src/controllers/subcategory.controller.ts
import { prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { isPrismaKnownError } from "../lib/prisma-error";
import type {
  CreateSubcategoryInput,
  SubcategoryQuery,
  UpdateSubcategoryInput,
} from "../validators/catalog";

// ─── CREATE ────────────────────────────────────────────────────────────────────

export async function createSubcategory(req: Request, res: Response) {
  const body = req.body as CreateSubcategoryInput;

  try {
    const subcategory = await prisma.subcategory.create({
      data: body,
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: { subcategory } });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      // P2002 = same name + categoryId combination pehle se hai (@@unique constraint)
      if (err.code === "P2002") {
        throw new AppError(
          "Is category mein is naam ki subcategory pehle se hai",
          409,
          "VALIDATION_ERROR",
        );
      }
      // P2003 = diya hua categoryId exist nahi karta
      if (err.code === "P2003") {
        throw new AppError("Category nahi mili", 404, "NOT_FOUND");
      }
    }
    throw err;
  }
}

// ─── LIST (public) ─────────────────────────────────────────────────────────────

export async function listSubcategories(_req: Request, res: Response) {
  const { page, limit, categoryId } = res.locals["query"] as SubcategoryQuery;
  const skip = (page - 1) * limit;

  // categoryId optional filter — agar diya toh sirf us category ki subcategories
  const where = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.subcategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.subcategory.count({ where }),
  ]);

  res.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── GET BY ID (public) ────────────────────────────────────────────────────────

export async function getSubcategoryById(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const subcategory = await prisma.subcategory.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!subcategory || !subcategory.isActive) {
    throw new AppError("Subcategory nahi mili", 404, "NOT_FOUND");
  }

  res.json({ success: true, data: { subcategory } });
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateSubcategory(req: Request, res: Response) {
  const id = req.params["id"] as string;
  const body = req.body as UpdateSubcategoryInput;

  try {
    const subcategory = await prisma.subcategory.update({
      where: { id },
      data: body,
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: { subcategory } });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      if (err.code === "P2025") {
        throw new AppError("Subcategory nahi mili", 404, "NOT_FOUND");
      }
      if (err.code === "P2002") {
        throw new AppError(
          "Is category mein is naam ki subcategory pehle se hai",
          409,
          "VALIDATION_ERROR",
        );
      }
    }
    throw err;
  }
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteSubcategory(req: Request, res: Response) {
  const id = req.params["id"] as string;

  try {
    await prisma.subcategory.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (isPrismaKnownError(err)) {
      if (err.code === "P2025") {
        throw new AppError("Subcategory nahi mili", 404, "NOT_FOUND");
      }
      // P2003 — is subcategory mein articles hain, pehle unhe delete karo
      if (err.code === "P2003") {
        throw new AppError(
          "Pehle is subcategory ke sabhi articles delete karo",
          409,
          "VALIDATION_ERROR",
        );
      }
    }
    throw err;
  }
}
