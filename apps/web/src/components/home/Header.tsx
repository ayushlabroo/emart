"use client";
// ─── Header ───────────────────────────────────────────────────────────────────
// Har page pe top bar. Auth store se user (Step 19d). Logged in → greeting +
// Orders + Cart badge + Logout. Logged out → Login / Register.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/lib/store/auth";
import { useCartStore } from "@/lib/store/cart";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Selector: sirf zarurat ki value subscribe karo (extra re-render se bacho)
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const cartCount = useCartStore((s) => s.count);

  async function handleLogout() {
    // Backend refresh token revoke kare (cookie clear). Fail ho bhi toh frontend clear karo.
    try {
      await api.post("/auth/logout", {});
    } catch {
      // ignore — chahe network fail ho, client side toh logout karna hi hai
    }
    setAccessToken(null);   // in-memory token hatao
    clearUser();            // Zustand user null
    queryClient.clear();    // cart/orders cache wipe (agle user ka data leak na ho)
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-green-600">
          EMart
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                Hi,{" "}
                <span className="font-medium text-gray-900">
                  {user.name ?? "there"}
                </span>
              </span>
              <Link
                href="/orders"
                className="text-sm font-medium text-gray-700 hover:text-green-600"
              >
                Orders
              </Link>
              <Link
                href="/cart"
                className="relative text-sm font-medium text-gray-700 hover:text-green-600"
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-green-600"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
