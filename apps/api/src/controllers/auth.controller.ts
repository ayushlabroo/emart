// apps/api/src/controllers/auth.controller.ts
import { prisma } from "@emart/database";
import { UserRole } from "@emart/types";
import { createHash } from "crypto";
import type { Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { clearAuthCookies, setAuthCookies } from "../lib/cookies";
import { signTokens, verifyRefreshToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { isPrismaKnownError } from "../lib/prisma-error";

// Refresh token 7 din mein expire hota hai — JWT_REFRESH_TTL ke saath match karta hai.
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// SHA-256 hash of the token — yahi DB mein store hoga, plain token kabhi nahi.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Login ya register ke baad refresh token DB mein save karo.
async function saveRefreshToken(userId: string, token: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
}

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

    const tokens = signTokens({ userId: user.id, role: user.role as UserRole });
    await saveRefreshToken(user.id, tokens.refreshToken); // DB mein save
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role, name },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2002") {
      throw new AppError(
        "Email ya phone pehle se registered hai",
        409,
        "VALIDATION_ERROR",
      );
    }
    throw err;
  }
}

// ─── LOGIN ─────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { customer: true },
  });

  if (!user || !(await verifyPassword(password, user.password))) {
    throw new AppError("Email ya password galat hai", 401, "UNAUTHENTICATED");
  }

  if (!user.isActive) {
    throw new AppError("Account disabled hai", 403, "FORBIDDEN");
  }

  const tokens = signTokens({ userId: user.id, role: user.role as UserRole });
  await saveRefreshToken(user.id, tokens.refreshToken); // DB mein save
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

// ─── REFRESH ───────────────────────────────────────────────
export async function refresh(req: Request, res: Response) {
  // Token cookie se aata hai (web), ya body se (mobile — baad mein).
  const token: string | undefined = req.cookies.refreshToken;

  if (!token) {
    throw new AppError("Refresh token nahi mila", 401, "UNAUTHENTICATED");
  }

  // Step 1: JWT signature + expiry verify karo.
  // Agar tampered ya expired → exception → global error handler pakdega.
  const payload = (() => {
    try {
      return verifyRefreshToken(token);
    } catch {
      throw new AppError(
        "Refresh token invalid ya expire ho gaya",
        401,
        "UNAUTHENTICATED",
      );
    }
  })();

  // Step 2: DB mein dhundo — revoked ya missing tokens reject karo.
  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError(
      "Refresh token invalid ya expire ho gaya",
      401,
      "UNAUTHENTICATED",
    );
  }

  // Step 3: Rotation — purana delete, naye tokens issue karo.
  await prisma.refreshToken.delete({ where: { tokenHash } });

  const newTokens = signTokens({ userId: payload.userId, role: payload.role });
  await saveRefreshToken(payload.userId, newTokens.refreshToken);
  setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

  res.json({
    success: true,
    data: {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    },
  });
}

// ─── ME ────────────────────────────────────────────────────
// JWT mein sirf userId + role hota hai. Name + email ke liye DB hit zaroori hai.
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      role: true,
      customer: { select: { name: true } },
    },
  });

  if (!user) {
    throw new AppError("User nahi mila", 404, "NOT_FOUND");
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.customer?.name ?? null,
      },
    },
  });
}

// ─── LOGOUT ────────────────────────────────────────────────
export async function logout(req: Request, res: Response) {
  const token: string | undefined = req.cookies.refreshToken;

  if (token) {
    // deleteMany kyunki findUnique + delete mein race condition ho sakti hai.
    // Agar token pehle se nahi mila (already logged out) — silently ignore.
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  clearAuthCookies(res);
  res.json({ success: true, data: null });
}
