import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"]) //
    .default("development"),

  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET should min 32 char"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET should min 32 char"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Galat ya missing environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // 1 = "error ke saath band hua"
}

export const env = parsed.data;
