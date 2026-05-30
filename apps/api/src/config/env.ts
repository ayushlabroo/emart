import "dotenv/config";
import { z } from "zod";

// 1) SCHEMA — yahaan likhte hain ki ek "sahi" env kaisa dikhta hai.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"]) // sirf yahi 3 values allowed
    .default("development"),

  // process.env.API_PORT hamesha STRING aati hai ("4000"), number nahi.
  // z.coerce.number() => pehle string ko number mein badlo, phir check karo.
  API_PORT: z.coerce.number().int().positive().default(4000),

  // Next.js web app kis origin se aayega. CORS (Point 5) ko ye chahiye hoga.
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
});

// 2) process.env ko schema se jaancho.
//    safeParse THROW nahi karta — ek result object lautaata hai.
const parsed = envSchema.safeParse(process.env);

// 3) Kuch galat hai? Saaf error dikhao aur app ko ABHI yahin band kar do.
if (!parsed.success) {
  console.error("❌ Galat ya missing environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // 1 = "error ke saath band hua"
}

// 4) Sab sahi? Toh ek validated + properly-typed object bahar bhejo.
export const env = parsed.data;
