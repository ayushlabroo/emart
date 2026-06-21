// apps/api/src/controllers/auth.controller.ts
import { prisma } from "@emart/database";
import { UserRole } from "@emart/types";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { setAuthCookies } from "../lib/cookies";
import { signTokens } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { isPrismaKnownError } from "../lib/prisma-error";

// ─── REGISTER ──────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  const { email, phone, password, name } = req.body;

  const hashedPassword = await hashPassword(password);

  try {
    // User + Customer EK SAATH banao — nested create.
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: UserRole.CUSTOMER, // self-register hamesha CUSTOMER
        customer: { create: { name } }, // Customer profile bhi sang-sang
      },
    });

    // Token banao (user.role Prisma-type hai, hamare UserRole se same strings — boundary pe cast)
    const tokens = signTokens({ userId: user.id, role: user.role as UserRole });
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Response: safe fields + tokens (tokens body mein MOBILE ke liye; web cookies use karega)
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role, name },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    // Email ya phone already exist → Prisma "P2002" unique-constraint error
    if (isPrismaKnownError(err) && err.code === "P2002") {
      throw new AppError(
        "Email ya phone pehle se registered hai",
        409,
        "VALIDATION_ERROR",
      );
    }
    throw err; // baaki sab global error-handler ko
  }
}

// ─── LOGIN ─────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { customer: true },
  });

  // ⚠️ Security: email galat ho ya password — DONO par SAME generic error.
  // Warna attacker pata laga lega ki kaunse emails registered hain.
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new AppError("Email ya password galat hai", 401, "UNAUTHENTICATED");
  }

  if (!user.isActive) {
    throw new AppError("Account disabled hai", 403, "FORBIDDEN");
  }

  const tokens = signTokens({ userId: user.id, role: user.role as UserRole });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.customer?.name ?? null,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
}
