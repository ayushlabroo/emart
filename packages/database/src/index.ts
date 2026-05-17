/**
 * Prisma Client singleton (Prisma 7+).
 *
 * Why a singleton?
 *   Each `new PrismaClient()` opens its own connection pool. In dev with
 *   hot-reload, naive instantiation creates a new pool on every reload
 *   and exhausts the database's max_connections within minutes.
 *
 * Prisma 7 specifics:
 *   - PrismaClient now requires a driver adapter (Rust query engine is gone).
 *   - For Node.js (Express on App Runner), we use @prisma/adapter-pg.
 *   - For edge runtimes (Workers, Vercel Edge), you'd use @prisma/adapter-neon
 *     instead — we don't need that here.
 *
 * The pattern:
 *   - Production: one client per Node process (created on first import,
 *     reused via Node's module cache).
 *   - Development: cache on globalThis so hot-reload reuses the same client.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Extend globalThis with a typed slot for our client.
// `var` declaration is intentional — globalThis augmentation requires it.
declare global {
  // eslint-disable-next-line no-var
  var __emartPrisma: PrismaClient | undefined;
}

/**
 * Build the Prisma Client with a pg driver adapter.
 *
 * Uses DATABASE_URL (the POOLED Neon URL with `-pooler` in the hostname).
 * This URL is read at module-load time from process.env — make sure your
 * app loads dotenv before importing from @emart/database.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Did you load .env before importing @emart/database?",
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // Log queries in development; only warnings/errors in production.
    log:
      process.env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["query", "warn", "error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__emartPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__emartPrisma = prisma;
}

// Re-export the Prisma namespace so consumers can use types like
// `Prisma.UserCreateInput` without importing from @prisma/client directly.
export { Prisma } from "@prisma/client";
export type { User } from "@prisma/client";
