// apps/api/src/controllers/cart.controller.ts
import { prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import type { AddToCartInput, UpdateCartItemInput } from "../validators/cart";

// ─── Helper ────────────────────────────────────────────────────────────────────
//
// req.user sirf userId deta hai (access token mein customerId nahi hoti —
// token payload chhota rakhte hain). Isliye ek quick DB lookup zaroori hai.
// Customer.userId pe @@unique hai — yeh PK lookup jaisi hi fast hai.

async function getCustomerId(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer) throw new AppError("Customer profile nahi mila", 404, "NOT_FOUND");
  return customer.id;
}

// Shared article select — same shape used across multiple queries
const articleSelect = {
  id: true,
  name: true,
  photo: true,
  price: true,
  mrp: true,
  unit: true,
} as const;

// ─── GET /cart ─────────────────────────────────────────────────────────────────

export async function getCart(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);

  const items = await prisma.cartItem.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" }, // pehle add kiya hua pehle dikhao
    include: { article: { select: articleSelect } },
  });

  // Subtotal = har item ka (price × qty) ka sum
  // Number() — Prisma Decimal ko JS number mein convert karta hai
  // toFixed(2) — "178.00" jaisi string (2 decimal places, money ke liye standard)
  const subtotal = items
    .reduce((acc, item) => acc + Number(item.article.price) * item.qty, 0)
    .toFixed(2);

  res.json({ success: true, data: { items, subtotal } });
}

// ─── POST /cart/items ──────────────────────────────────────────────────────────
//
// Yeh endpoint UPSERT karta hai:
// - Article pehle se cart mein hai → qty UPDATE ho jaati hai (replace, not add)
// - Nahi hai → nayi row CREATE hoti hai
//
// Zepto/Blinkit style: "+" button tap karta hai → naya qty bhejta hai (total, not delta)
// Example: 2 Amul Butter hain, "+" karo → qty: 3 aata hai (2+1), not qty: 1

export async function addToCart(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const { articleId, qty } = req.body as AddToCartInput;

  // Article exist karta hai aur active hai?
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { isActive: true },
  });
  if (!article || !article.isActive) {
    throw new AppError("Article nahi mila ya unavailable hai", 404, "NOT_FOUND");
  }

  // upsert: @@unique([customerId, articleId]) ko where key ke roop mein use karo
  const item = await prisma.cartItem.upsert({
    where: { customerId_articleId: { customerId, articleId } },
    create: { customerId, articleId, qty },
    update: { qty },
    include: { article: { select: articleSelect } },
  });

  res.status(201).json({ success: true, data: { item } });
}

// ─── PATCH /cart/items/:id ─────────────────────────────────────────────────────

export async function updateCartItem(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;
  const { qty } = req.body as UpdateCartItemInput;

  // updateMany: arbitrary where support karta hai (update/delete nahi karta)
  // { id, customerId } — dono match hone chahiye = automatic ownership check
  // Koi doosra user id guess karke apna item update nahi kar sakta
  const result = await prisma.cartItem.updateMany({
    where: { id, customerId },
    data: { qty },
  });

  // count === 0 → ya toh item nahi mila, ya doosre customer ka tha — dono pe 404
  // (401/403 nahi — attacker ko ownership info leak nahi karte)
  if (result.count === 0) throw new AppError("Cart item nahi mila", 404, "NOT_FOUND");

  // updateMany include support nahi karta — alag se fetch karo
  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: { article: { select: articleSelect } },
  });

  res.json({ success: true, data: { item } });
}

// ─── DELETE /cart/items/:id ────────────────────────────────────────────────────

export async function removeCartItem(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;

  const result = await prisma.cartItem.deleteMany({
    where: { id, customerId }, // ownership check same pattern
  });

  if (result.count === 0) throw new AppError("Cart item nahi mila", 404, "NOT_FOUND");

  res.json({ success: true, data: null });
}

// ─── DELETE /cart ──────────────────────────────────────────────────────────────

export async function clearCart(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);

  // deleteMany — zero items hone pe bhi koi error nahi (already empty cart = OK)
  await prisma.cartItem.deleteMany({ where: { customerId } });

  res.json({ success: true, data: null });
}
