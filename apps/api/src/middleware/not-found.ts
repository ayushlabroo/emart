import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";

export function notFoundHandler(
  req: Request,
  _res: Response, // _ prefix = "ye param yahaan use nahi ho raha"
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
