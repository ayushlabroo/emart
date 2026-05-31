import type { NextFunction, Request, Response } from "express";
import { type ZodType } from "zod";
import { AppError } from "../errors/app-error";

// Ek schema lo, ek middleware lautao jo us schema se req.body validate kare.
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstMessage = result.error.issues[0]?.message ?? "Galat input";
      throw new AppError(firstMessage, 400, "VALIDATION_ERROR");
    }

    req.body = result.data;
    next();
  };
}
