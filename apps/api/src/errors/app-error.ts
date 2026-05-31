import type { ApiErrorCode } from "@emart/types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: ApiErrorCode) {
    super(message); // parent Error ko message do
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); // saaf stack trace
  }
}
