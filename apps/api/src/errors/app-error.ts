import type { ApiErrorCode } from "@emart/types";

// "extends Error" => JS ke built-in Error ki saari khoobi le lo,
// upar se apni cheezein (statusCode, code) jod do.
export class AppError extends Error {
  public readonly statusCode: number; // HTTP status: 404, 401, 400...
  public readonly code: ApiErrorCode; // "NOT_FOUND" | "FORBIDDEN" | ...
  public readonly isOperational: boolean; // "expected" error hai (bug nahi)

  constructor(message: string, statusCode: number, code: ApiErrorCode) {
    super(message); // parent Error ko message do
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); // saaf stack trace
  }
}
