// ─── DEMO: cross-package imports (Step 5) ────────────────────────
// This comment shows how apps/api will consume shared packages.
// Uncomment to verify the wiring; will be replaced for real in Step 8.
//
// import { UserRole, type ApiResponse } from "@emart/types";
// import { formatPrice, isValidIndianPincode } from "@emart/utils";
//
// const role: UserRole = UserRole.CUSTOMER;
// const price: string = formatPrice(129900);       // "₹1,299.00"
// const ok: boolean = isValidIndianPincode("400001"); // true
//
// const response: ApiResponse<{ message: string }> = {
//   success: true,
//   data: { message: `Hello ${role}, price is ${price}, valid: ${ok}` },
// };
// ─────────────────────────────────────────────────────────────────
