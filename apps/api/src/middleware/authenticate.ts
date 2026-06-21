import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { verifyAccessToken } from "../lib/jwt";

// Yeh middleware har protected route ke pehle lagega.
// Kaam: access token verify karo, req.user attach karo.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // Token do jagah se aa sakta hai:
  // 1. Cookie — web (browser automatically bhejta hai)
  // 2. Authorization header — mobile app (manually set karta hai)
  const token =
    req.cookies.accessToken ?? extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError("Login zaroori hai", 401, "UNAUTHENTICATED");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next(); // token sahi hai — aage bado
  } catch {
    // JWT expired ya tampered — same generic error (attacker ko detail mat do)
    throw new AppError("Session expire ho gaya, dobara login karein", 401, "UNAUTHENTICATED");
  }
}

// "Bearer eyJhbGci..." → "eyJhbGci..."
function extractBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice(7); // "Bearer " = 7 characters
}
