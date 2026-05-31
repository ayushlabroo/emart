import { UserRole } from "@emart/types";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

const accessTtl = env.JWT_ACCESS_TTL as unknown as SignOptions["expiresIn"];
const refreshTtl = env.JWT_REFRESH_TTL as unknown as SignOptions["expiresIn"];

// Access token banao — chhoti zindagi (15 min).
export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: accessTtl });
}

// Refresh token banao — lambi zindagi (7 din).
export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshTtl });
}

// Dono ek saath — login/register dono lautayenge.
export function signTokens(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
