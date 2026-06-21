// apps/api/src/controllers/order.controller.ts
import { prisma } from "@emart/database";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import type { OrderQuery, PlaceOrderInput } from "../validators/order";

async function getCustomerId(userId: string): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!customer) throw new AppError("Customer profile nahi mila", 404, "NOT_FOUND");
  return customer.id;
}

// ─── POST /orders ──────────────────────────────────────────────────────────────
//
// Full checkout flow — 5 phases:
//  1. Cart fetch + validate
//  2. Address validate
//  3. Har item ke liye stock wala store dhundo
//  4. Totals calculate
//  5. Atomic transaction: Order create → inventory deduct → cart clear

export async function placeOrder(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const { addressId } = req.body as PlaceOrderInput;

  // ── Phase 1: cart fetch + validate ─────────────────────────────────────────

  const cartItems = await prisma.cartItem.findMany({
    where: { customerId },
    include: {
      article: {
        select: {
          id: true,
          name: true,
          photo: true,
          unit: true,
          mrp: true,
          price: true,
          discount: true,
          isActive: true,
        },
      },
    },
  });

  if (cartItems.length === 0) {
    throw new AppError("Cart khaali hai", 400, "CART_EMPTY");
  }

  // Koi article band toh nahi ho gaya cart mein add karne ke baad?
  const unavailable = cartItems.find((item) => !item.article.isActive);
  if (unavailable) {
    throw new AppError(
      `"${unavailable.article.name}" abhi available nahi hai — cart se hata ke dobara try karein`,
      409,
      "ITEM_UNAVAILABLE",
    );
  }

  // ── Phase 2: address validate ───────────────────────────────────────────────

  const address = await prisma.address.findFirst({
    where: { id: addressId, customerId },
  });
  if (!address) throw new AppError("Delivery address nahi mili", 404, "NOT_FOUND");

  // ── Phase 3: har item ke liye stock wala store dhundo ──────────────────────
  //
  // Real dark-store model: customer pincode → nearest store.
  // Abhi simplified: koi bhi active store jo required stock rakhe.
  // Step 21 (multi-store) mein pincode-based nearest store select karenge.

  const storeAssignments: Array<{ cartItem: (typeof cartItems)[number]; storeId: string }> = [];

  for (const cartItem of cartItems) {
    const inv = await prisma.inventory.findFirst({
      where: {
        articleId: cartItem.articleId,
        stock: { gte: cartItem.qty },
        store: { isActive: true },
      },
      select: { storeId: true },
    });

    if (!inv) {
      throw new AppError(
        `"${cartItem.article.name}" stock mein nahi hai`,
        409,
        "OUT_OF_STOCK",
      );
    }

    storeAssignments.push({ cartItem, storeId: inv.storeId });
  }

  // ── Phase 4: totals calculate ───────────────────────────────────────────────
  //
  // subtotal = Σ(price × qty)
  // Number() — Prisma Decimal → JS number. Display ke liye fine.
  // Production mein financial reporting ke liye decimal.js use karte hain.
  //
  // Abhi: discount=0, tax=0, deliveryFee=0
  // Later steps: coupon codes, GST, distance-based delivery fee

  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.article.price) * item.qty,
    0,
  );
  const total = subtotal;

  // ── Phase 5: atomic transaction ─────────────────────────────────────────────
  //
  // Teen kaam EK transaction mein — ya sab hoga, ya kuch nahi:
  //  A. Order + OrderItems create (article details snapshot)
  //  B. Inventory deduct (atomic WHERE stock >= qty — race condition guard)
  //  C. Cart clear

  const order = await prisma.$transaction(async (tx) => {
    // A. Order create with nested OrderItems (createMany)
    const newOrder = await tx.order.create({
      data: {
        customerId,
        subtotal,
        discount: 0,
        deliveryFee: 0,
        tax: 0,
        total,
        // Address SNAPSHOT — original address baad mein delete ho sake, order history safe rahe
        deliveryLine1: address.line1,
        deliveryCity: address.city,
        deliveryPincode: address.pincode,
        items: {
          createMany: {
            data: storeAssignments.map(({ cartItem, storeId }) => ({
              // Article ki details SNAPSHOT — article ka price baad mein change ho toh
              // order history affect nahi honi chahiye (Zepto/Amazon yahi karte hain)
              articleName: cartItem.article.name,
              photo: cartItem.article.photo ?? null,
              unit: cartItem.article.unit,
              mrp: cartItem.article.mrp,
              price: cartItem.article.price,
              discount: cartItem.article.discount,
              qty: cartItem.qty,
              articleId: cartItem.articleId,
              storeId,
            })),
          },
        },
      },
      include: { items: true },
    });

    // B. Inventory deduct — optimistic concurrency control
    //
    // RACE CONDITION PROBLEM:
    // Do customers ek saath checkout karein, dono Phase 3 mein stock=5 dekhein,
    // dono 5 units order karein → stock -5 ho jaaye (oversell).
    //
    // SOLUTION: transaction ke andar bhi WHERE stock >= qty check karo.
    // Agar beech mein kisi aur ne le liya → updateMany count=0 → throw → FULL ROLLBACK.
    // Yeh "optimistic concurrency" hai — SELECT FOR UPDATE (pessimistic) se zyada scalable.

    for (const { cartItem, storeId } of storeAssignments) {
      const result = await tx.inventory.updateMany({
        where: {
          storeId,
          articleId: cartItem.articleId,
          stock: { gte: cartItem.qty }, // atomic stock check
        },
        data: { stock: { decrement: cartItem.qty } },
      });

      if (result.count === 0) {
        // Throw → transaction rollback → kuch bhi DB mein nahi gaya
        throw new AppError(
          `"${cartItem.article.name}" abhi stock mein nahi raha — dobara try karein`,
          409,
          "OUT_OF_STOCK",
        );
      }
    }

    // C. Cart clear
    await tx.cartItem.deleteMany({ where: { customerId } });

    return newOrder;
  });

  res.status(201).json({ success: true, data: { order } });
}

// ─── GET /orders ───────────────────────────────────────────────────────────────

export async function listOrders(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const { page, limit } = res.locals["query"] as OrderQuery;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" }, // latest order pehle
      skip,
      take: limit,
      include: {
        // List mein items ka summary — full detail getOrder se milegi
        items: {
          select: {
            id: true,
            articleName: true,
            photo: true,
            unit: true,
            price: true,
            qty: true,
          },
        },
      },
    }),
    prisma.order.count({ where: { customerId } }),
  ]);

  res.json({
    success: true,
    data: { orders, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── GET /orders/:id ───────────────────────────────────────────────────────────

export async function getOrder(req: Request, res: Response) {
  const customerId = await getCustomerId(req.user!.userId);
  const id = req.params["id"] as string;

  const order = await prisma.order.findFirst({
    where: { id, customerId }, // findFirst with non-unique field = ownership check built-in
    include: {
      items: {
        include: {
          // Current article state bhi attach karo (isActive check ke liye)
          // Lekin name/price OrderItem ke SNAPSHOT se aate hain — kabhi article se nahi
          article: { select: { id: true, isActive: true } },
        },
      },
    },
  });

  if (!order) throw new AppError("Order nahi mila", 404, "NOT_FOUND");

  res.json({ success: true, data: { order } });
}
