"use client";
// ─── Providers ───────────────────────────────────────────────────────────────
//
// Next.js App Router mein layout.tsx ek Server Component hota hai — wahan
// hooks (useState, useEffect) nahi chal sakte. Isliye yeh alag "use client"
// wrapper banate hain jo layout mein children ko wrap karta hai.
//
// Is file mein 2 cheezein hain:
//   1. QueryClientProvider — TanStack Query ka container
//   2. AuthHydrator       — page load pe silently user session restore karta hai

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef } from "react";
import api, { setAccessToken } from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/lib/store/auth";
import { CartSync } from "@/components/CartSync";

// ─── QueryClient singleton ────────────────────────────────────────────────────
// Browser mein ek hi instance chahiye — naye render pe naya banana galat hai
// (cache reset ho jaata hai). Server pe har request ke liye naya chahiye.
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server-side render: fresh instance (request-scoped)
    return new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    });
  }
  // Browser: ek hi instance — cache aur background refetch yahan rehte hain
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // 5 min tak data "fresh" maano — bar bar refetch nahi karega
          staleTime: 5 * 60 * 1000,
          // Network fail ho toh sirf 1 baar dobara try karo
          retry: 1,
        },
      },
    });
  }
  return browserQueryClient;
}

// ─── AuthHydrator ─────────────────────────────────────────────────────────────
// Page refresh ke baad in-memory access token chali jaati hai.
// Yeh component silently check karta hai: kya httpOnly cookie abhi bhi valid hai?
// Haan → naya access token lo + user info fetch karo.
// Nahi → koi problem nahi, user logged out hai.
//
// Raw `axios` (not `api`) use karte hain refresh ke liye — warna `api` ka
// response interceptor dobara refresh karne ki koshish karega → infinite loop.
function AuthHydrator() {
  const initialized = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    // React 18 Strict Mode: development mein effects 2 baar chalte hain.
    // `ref` se ensure karte hain ke refresh sirf ek baar ho.
    if (initialized.current) return;
    initialized.current = true;

    const baseURL =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

    // Step 1: httpOnly refreshToken cookie se naya access token maango
    axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        // Step 2: access token memory mein set karo (interceptor future requests mein lagaayega)
        setAccessToken(data.data.accessToken as string);
        // Step 3: /auth/me se name + email + role lo (JWT payload mein sirf userId + role hota hai)
        return api.get("/auth/me");
      })
      .then(({ data }) => {
        // Step 4: Zustand auth store mein user set karo → navbar greeting dikhega
        setUser(data.data.user as AuthUser);
      })
      .catch(() => {
        // Cookie nahi thi ya expire ho gayi — user logged out hai, silently ignore karo
      })
      .finally(() => {
        // Success ho ya fail — restore attempt khatam. RequireAuth ab decide kar sakta hai.
        setHydrated();
      });
  }, [setUser, setHydrated]);

  // Yeh component kuch render nahi karta — sirf side effect ke liye hai
  return null;
}

// ─── Providers (exported) ─────────────────────────────────────────────────────
// layout.tsx mein `<Providers>{children}</Providers>` use karenge.
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      <CartSync />
      {children}
    </QueryClientProvider>
  );
}
