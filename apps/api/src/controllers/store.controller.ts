import { prisma } from "@emart/database";
import { UserRole } from "@emart/types";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import type {
  CreateStoreInput,
  InventoryQuery,
  StoreQuery,
  UpdateStoreInput,
  UpsertInventoryInput,
} from "../validators/store";

// ─── Helpers ───────────────────────────────────────────────────────────────────

// STORE_MANAGER ka Manager record ID dhundho (userId → manager.id)
// req.user mein sirf userId aur role hota hai — Manager row alag hai
async function getManagerId(userId: string): Promise<string> {
  const manager = await prisma.manager.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!manager) throw new AppError("Manager profile nahi mila", 404, "NOT_FOUND");
  return manager.id;
}

// Store access verify karo:
//   ADMIN    → store exist kare bas kaafi hai
//   STORE_MANAGER → store exist kare + store.managerId === unka managerId
async function verifyStoreAccess(storeId: string, role: UserRole, userId: string): Promise<void> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, managerId: true },
  });
  if (!store) throw new AppError("Store nahi mila", 404, "NOT_FOUND");

  if (role === UserRole.STORE_MANAGER) {
    const managerId = await getManagerId(userId);
    if (store.managerId !== managerId) {
      // 403 FORBIDDEN: store exist karta hai lekin yeh aapka nahi
      // CUSTOMER wali trick (count===0 → 404) yahan nahi — STORE_MANAGER
      // ko pata hona chahiye ki store exist karta hai, bas access nahi
      throw new AppError("Yeh aapka store nahi hai", 403, "FORBIDDEN");
    }
  }
}

// ─── POST /stores ──────────────────────────────────────────────────────────────

export async function createStore(req: Request, res: Response) {
  const { name, pincode, managerId } = req.body as CreateStoreInput;

  const store = await prisma.store.create({
    data: { name, pincode, managerId },
    include: {
      manager: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, data: { store } });
}

// ─── GET /stores ───────────────────────────────────────────────────────────────

export async function listStores(req: Request, res: Response) {
  const { page, limit, pincode, isActive } = res.locals["query"] as StoreQuery;
  const skip = (page - 1) * limit;

  // Dynamic where: jo filter diya wo lagao, jo nahi diya wo skip
  const where = {
    ...(pincode !== undefined && { pincode }),
    ...(isActive !== undefined && { isActive }),
  };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        pincode: true,
        isActive: true,
        manager: { select: { id: true, name: true } },
        // _count = relation ki row count — extra query nahi, Prisma JOIN se lata hai
        _count: { select: { inventory: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  res.json({
    success: true,
    data: { stores, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── GET /stores/:id ───────────────────────────────────────────────────────────

export async function getStore(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          photo: true,
          user: { select: { email: true } },
        },
      },
      _count: { select: { inventory: true, orderItems: true } },
    },
  });

  if (!store) throw new AppError("Store nahi mila", 404, "NOT_FOUND");

  res.json({ success: true, data: { store } });
}

// ─── PATCH /stores/:id ─────────────────────────────────────────────────────────

export async function updateStore(req: Request, res: Response) {
  const id = req.params["id"] as string;
  const data = req.body as UpdateStoreInput;

  // findUnique pehle — agar store nahi mila toh 404, Prisma ka P2025 rely mat karo
  const exists = await prisma.store.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new AppError("Store nahi mila", 404, "NOT_FOUND");

  const store = await prisma.store.update({
    where: { id },
    data,
    include: {
      manager: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: { store } });
}

// ─── DELETE /stores/:id ────────────────────────────────────────────────────────
//
// SOFT DELETE — isActive=false, row DB mein rehti hai.
//
// Kyun hard delete nahi?
// OrderItem.storeId → Store pe Restrict FK hai. Agar store delete karo aur
// kisi order mein woh storeId hai, Prisma error throw karega.
// Real companies bhi yahi karte hain: store "band" hoti hai, history nahi jaati.

export async function deleteStore(req: Request, res: Response) {
  const id = req.params["id"] as string;

  const exists = await prisma.store.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new AppError("Store nahi mila", 404, "NOT_FOUND");

  await prisma.store.update({ where: { id }, data: { isActive: false } });

  res.json({ success: true, data: { message: "Store deactivate ho gaya" } });
}

// ─── PUT /stores/:id/inventory ─────────────────────────────────────────────────
//
// UPSERT = "update or insert" — ek hi call mein:
//   → row exist kare → stock update karo
//   → row nahi hai   → nayi row create karo
//
// Prisma syntax:
//   where  : unique key se dhundho (composite PK = storeId + articleId)
//   create : agar nahi mila toh yeh data daal do
//   update : agar mila toh yeh changes karo
//
// Stock absolute value hai — "set to X", not "add X".
// Zepto/Blinkit style: warehouse manager manually count karke override karta hai.

export async function upsertInventory(req: Request, res: Response) {
  const storeId = req.params["id"] as string;
  const { articleId, stock } = req.body as UpsertInventoryInput;

  // Role-aware ownership check
  await verifyStoreAccess(storeId, req.user!.role, req.user!.userId);

  // Article exist karta hai?
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true },
  });
  if (!article) throw new AppError("Article nahi mila", 404, "NOT_FOUND");

  const inventory = await prisma.inventory.upsert({
    where: { storeId_articleId: { storeId, articleId } },
    create: { storeId, articleId, stock },
    update: { stock },
  });

  res.json({ success: true, data: { inventory } });
}

// ─── GET /stores/:id/inventory ─────────────────────────────────────────────────

export async function listInventory(req: Request, res: Response) {
  const storeId = req.params["id"] as string;
  const { page, limit } = res.locals["query"] as InventoryQuery;
  const skip = (page - 1) * limit;

  await verifyStoreAccess(storeId, req.user!.role, req.user!.userId);

  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where: { storeId },
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        article: {
          select: { id: true, name: true, unit: true, mrp: true, price: true, isActive: true },
        },
      },
    }),
    prisma.inventory.count({ where: { storeId } }),
  ]);

  res.json({
    success: true,
    data: { inventory, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
