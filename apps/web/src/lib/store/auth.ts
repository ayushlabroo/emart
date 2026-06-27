// ─── Auth Store (Zustand) ─────────────────────────────────────────────────────
//
// Zustand ek global state manager hai — React ke liye ek "shared variable" jaisa.
// `create()` function ek hook return karta hai (`useAuthStore`) jo kisi bhi
// component mein use ho sakta hai. Jab store mein kuch change hota hai, sirf woh
// components re-render hote hain jinhe us value ki zarurat hai.
//
// Components ke BAHAR bhi use kar sakte ho: useAuthStore.getState().setUser(...)
// (login/register pages mein yahi karenge)

import { create } from "zustand";
import type { UserRole } from "@emart/types";

// Yeh woh shape hai jo API return karta hai: /auth/login, /auth/register, /auth/me
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
}

// Store ki puri shape — state + actions dono ek jagah
interface AuthStore {
  user: AuthUser | null;            // null = logged out
  // hydrated = AuthHydrator (providers.tsx) ne page-load wala session-restore
  // attempt complete kar liya hai. Tab tak RequireAuth wait karta hai — warna
  // refresh pe user null dekh ke galti se /login pe bhej deta.
  hydrated: boolean;
  setUser: (user: AuthUser) => void; // login ke baad call karo
  clearUser: () => void;             // logout ke baad call karo
  setHydrated: () => void;           // AuthHydrator finish hone pe call hota hai
}

// `create` ek hook generate karta hai.
// `set` function se state update hoti hai — directly mutate kabhi mat karo.
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setHydrated: () => set({ hydrated: true }),
}));
