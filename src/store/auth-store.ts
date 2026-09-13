"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/types";

interface AuthState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
    }),
    { name: "rcy-auth" }
  )
);

/** convenience hook */
export function useAuth() {
  const { user, setUser } = useAuthStore();
  return {
    user,
    isAdmin: user?.role === "admin",
    isMember: !!user,
    setUser,
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    },
    refresh: async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data.user ?? null);
        return data.user ?? null;
      } catch {
        return null;
      }
    },
  };
}
