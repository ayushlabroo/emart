import type { Response } from "express";
import { env } from "../config/env";

const isProd = env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true, // JS (document.cookie) se padha NAHI ja sakta → XSS-safe
  secure: isProd, // prod mein sirf HTTPS pe bheje
  sameSite: isProd ? "none" : "lax", // cross-site (Vercel ↔ App Runner) ke liye prod mein "none"
} as const;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 min (milliseconds mein)
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
    path: "/api/v1/auth", // refresh token sirf auth routes pe hi bheja jaye
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: "/api/v1/auth",
  });
}
