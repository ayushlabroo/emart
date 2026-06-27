import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email daalo"),
  password: z.string().min(1, "Password daalo"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Naam kam se kam 2 characters ka hona chahiye"),
    email: z.string().email("Valid email daalo"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Sahi 10-digit Indian mobile number daalo"),
    password: z
      .string()
      .min(8, "Password kam se kam 8 characters ka hona chahiye"),
    confirmPassword: z.string().min(1, "Password confirm karo"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords match nahi kar rahe",
    path: ["confirmPassword"], // error sirf confirmPassword field pe dikhega
  });

// TypeScript types — Zod schema se automatically derive hote hain
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
