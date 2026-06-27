"use client";
// ─── RequireAuth ──────────────────────────────────────────────────────────────
// Protected pages (cart, checkout, orders) ko isme wrap karo. Logged-out user ko
// /login pe bhej deta hai.
//
// KEY: `hydrated` flag ka wait karna zaroori hai. Page refresh pe AuthHydrator
// async chalta hai — agar turant `user` null dekh ke redirect karein toh logged-in
// user bhi galti se /login pe chala jaayega. Isliye hydrated hone tak spinner.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Spinner } from "@/components/ui/Spinner";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    // Session restore complete ho chuka hai aur phir bhi user nahi → login bhejo
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  // Abhi tak session restore ho raha hai — spinner
  if (!hydrated) return <Spinner />;

  // Hydrated but no user → redirect chal raha hai, kuch flash mat karo
  if (!user) return <Spinner />;

  return <>{children}</>;
}
