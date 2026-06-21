import { z } from "zod";

// Indian pincode = 6 digits, leading zero allowed (e.g. 011001 Delhi)
const pincodeSchema = z.string().regex(/^\d{6}$/, "Pincode 6 digits ka hona chahiye");

export const createAddressSchema = z.object({
  line1: z.string().min(5, "Address kam se kam 5 characters ka hona chahiye").max(200),
  city: z.string().min(2, "City naam bahut chhota hai").max(100),
  pincode: pincodeSchema,
  isDefault: z.boolean().optional().default(false),
});

// PATCH — har field optional hai (sirf jo bhejo woh update ho)
export const updateAddressSchema = z.object({
  line1: z.string().min(5).max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: pincodeSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
