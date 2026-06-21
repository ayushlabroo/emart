import type { UserRole } from "@emart/types";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

// Factory: allowed roles lo, ek middleware function return karo.
//
// Usage:
//   router.delete('/product/:id', authenticate, authorize('ADMIN'), deleteProduct)
//   router.get('/store/orders', authenticate, authorize('ADMIN', 'STORE_MANAGER'), getOrders)
export function authorize(...allowedRoles: UserRole[]) {
  return function (req: Request, _res: Response, next: NextFunction) {
    // authenticate pehle chalna chahiye — req.user na ho toh yeh code hi nahi chahiye tha
    if (!req.user) {
      throw new AppError("Login zaroori hai", 401, "UNAUTHENTICATED");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Yeh kaam karne ki permission nahi hai", 403, "FORBIDDEN");
    }

    next();
  };
}
