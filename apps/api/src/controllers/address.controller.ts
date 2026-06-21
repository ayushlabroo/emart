// apps/api/src/controllers/address.controller.ts
import { prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "../validators/address";

// Cart controller jaisa hi — userId se customerId nikalo
async function getCustomerId(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer)
    throw new AppError("Customer profile nahi mila", 404, "NOT_FOUND");
  return customer.id;
}

// ─── GET /addresses ────────────────────────────────────────────────────────────

export async function listAddresses(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);

  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: [
      { isDefault: "desc" }, // default address pehle
      { id: "asc" },
    ],
  });

  res.json({ success: true, data: { addresses } });
}

// ─── POST /addresses ───────────────────────────────────────────────────────────
//
// Agar pehli address hai ya isDefault: true bheja → transaction mein default set karo.
// Agar sirf ek hi address hai customer ke paas, usse default banana sensible hai.

export async function createAddress(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const body = req.body as CreateAddressInput;

  // Existing addresses count karo
  const existingCount = await prisma.address.count({ where: { customerId } });

  // Pehli address hamesha default hogi (chahe client ne bheja ho ya nahi)
  const shouldBeDefault = body.isDefault || existingCount === 0;

  let address;

  if (shouldBeDefault) {
    // Transaction: pehle sab false karo, phir nayi create karo with isDefault: true
    [, address] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      }),
      prisma.address.create({
        data: { ...body, customerId, isDefault: true },
      }),
    ]);
  } else {
    address = await prisma.address.create({
      data: { ...body, customerId },
    });
  }

  res.status(201).json({ success: true, data: { address } });
}

// ─── PATCH /addresses/:id ──────────────────────────────────────────────────────

export async function updateAddress(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;
  const body = req.body as UpdateAddressInput;

  // isDefault: true bheja → transaction chahiye (cart wala ownership pattern + default swap)
  if (body.isDefault === true) {
    const [, address] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      }),
      prisma.address.updateMany({
        where: { id, customerId }, // ownership check
        data: body,
      }),
    ]);

    if (address.count === 0)
      throw new AppError("Address nahi mili", 404, "NOT_FOUND");

    const updated = await prisma.address.findUnique({ where: { id } });
    return res.json({ success: true, data: { address: updated } });
  }

  // Simple update (no default change)
  const result = await prisma.address.updateMany({
    where: { id, customerId },
    data: body,
  });

  if (result.count === 0)
    throw new AppError("Address nahi mili", 404, "NOT_FOUND");

  const address = await prisma.address.findUnique({ where: { id } });
  res.json({ success: true, data: { address } });
}

// ─── PATCH /addresses/:id/default ─────────────────────────────────────────────
//
// WHY A SEPARATE ROUTE?
// "Set as default" ek distinct action hai — ek step, clear intent.
// PATCH /addresses/:id se bhi ho sakta tha (isDefault: true bhejo),
// lekin alag route frontend ko cleaner API deta hai: setDefault(id) ek call.

export async function setDefaultAddress(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;

  // Pehle verify karo ki address is customer ki hai
  const exists = await prisma.address.findFirst({ where: { id, customerId } });
  if (!exists) throw new AppError("Address nahi mili", 404, "NOT_FOUND");

  // Transaction: sab false → yeh wali true
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { customerId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  const address = await prisma.address.findUnique({ where: { id } });
  res.json({ success: true, data: { address } });
}

// ─── DELETE /addresses/:id ─────────────────────────────────────────────────────
//
// Edge case: agar default address delete ho → kisi doosri ko default banana chahiye.
// Simplest rule: oldest remaining address ko default banao (orderBy id asc, take 1).

export async function deleteAddress(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;

  // Ownership check + default status ek saath
  const address = await prisma.address.findFirst({ where: { id, customerId } });
  if (!address) throw new AppError("Address nahi mili", 404, "NOT_FOUND");

  if (address.isDefault) {
    // Default address delete ho rahi hai — pehle delete, phir oldest ko default banao
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      const next = await tx.address.findFirst({
        where: { customerId },
        orderBy: { id: "asc" },
      });

      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    });
  } else {
    await prisma.address.delete({ where: { id } });
  }

  res.json({ success: true, data: null });
}
