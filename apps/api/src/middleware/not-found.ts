import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(
    new AppError(
      `Route nahi mila: ${req.method} ${req.originalUrl}`,
      404,
      "NOT_FOUND",
    ),
  );
}
