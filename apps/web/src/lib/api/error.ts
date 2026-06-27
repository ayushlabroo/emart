// Axios error se backend ka { error } message nikaalne ka helper.
// Backend hamesha { success:false, error, code } bhejta hai — wahi dikhana hai.
import { AxiosError } from "axios";

export function getErrorMessage(
  err: unknown,
  fallback = "Kuch galat ho gaya, dobara try karo",
): string {
  const e = err as AxiosError<{ error?: string }>;
  return e?.response?.data?.error ?? fallback;
}
