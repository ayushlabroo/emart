import type { ApiErrorCode } from "@emart/types";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error";
import { logger } from "../lib/logger";

// 🔑 KHAAS BAAT: error-handling middleware ke 4 ARGUMENTS hote hain
// (err, req, res, next). Express SIRF iss 4-argument shape se pehchanta
// hai ki "ye error handler hai." 4 na hue toh Express ise normal middleware
// samajh lega aur error kabhi nahi pakdega. Ye galti dhoondhna mushkil hai!
export function errorHandler(
  err: unknown, // kuch bhi aa sakta hai, isliye "unknown"
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Default: agar hamein error ki samajh na aaye, toh 500 (server ki galti)
  let statusCode = 500;
  let code: ApiErrorCode = "INTERNAL_ERROR";
  let message = "Kuch gadbad ho gayi. Thodi der baad koshish karein.";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  logger.error("Request fail hui", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    // err agar asli Error object hai toh uska message/stack lo
    message: err instanceof Error ? err.message : String(err),
  });

  // Client ko CONSISTENT shape mein jawab do (ApiError)
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
}
