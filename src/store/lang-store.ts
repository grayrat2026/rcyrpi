"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/types";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "bn",
      setLang: (l) => set({ lang: l }),
      toggle: () => set({ lang: get().lang === "bn" ? "en" : "bn" }),
    }),
    { name: "rcy-lang" }
  )
);
