import type { NextFunction, Request, Response } from "express";
import { type ZodType } from "zod";
import { AppError } from "../errors/app-error";

// source = "body"  → JSON body validate karo (POST/PATCH ke liye)
// source = "query" → URL query params validate karo (GET list endpoints ke liye)
//                    Query params hamesha STRING aate hain — Zod schemas mein z.coerce use karo.
export function validate(schema: ZodType, source: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === "query" ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      const firstMessage = result.error.issues[0]?.message ?? "Galat input";
      throw new AppError(firstMessage, 400, "VALIDATION_ERROR");
    }

    if (source === "query") {
      // Express 5 mein req.query ek getter hai — directly assign nahi ho sakta.
      // res.locals isi kaam ke liye bana hai: middleware se route handler ko data dena.
      res.locals["query"] = result.data;
    } else {
      req.body = result.data;
    }
    next();
  };
}
