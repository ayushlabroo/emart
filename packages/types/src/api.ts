export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code: ApiErrorCode;
}

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "CART_EMPTY"
  | "ITEM_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "PAYMENT_FAILED"
  | "PAYMENT_ALREADY_DONE"
  | "PAYMENT_INVALID_SIGNATURE"
  | "ALREADY_REVIEWED"
  | "NOT_PURCHASED";
