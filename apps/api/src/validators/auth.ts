// apps/api/src/validators/auth.ts
import { isValidIndianPhone } from "@emart/utils";
import { z } from "zod";

// Register ke liye client se kya-kya aana chahiye, aur har field ke rules.
export const registerSchema = z.object({
  email: z.email("Sahi email daalo"),
  phone: z
    .string()
    .refine(isValidIndianPhone, "Sahi Indian mobile number daalo"),
  password: z.string().min(8, "Password kam se kam 8 characters ka ho"),
  name: z.string().min(1, "Naam zaroori hai").max(80),
});

// Login ke liye bas email + password.
export const loginSchema = z.object({
  email: z.email("Sahi email daalo"),
  password: z.string().min(1, "Password zaroori hai"),
});

// 🎁 Bonus: Zod schema se TypeScript type AUTOMATICALLY nikal aata hai.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
