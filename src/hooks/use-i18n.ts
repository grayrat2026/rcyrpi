"use client";

import { useCallback } from "react";
import { useLangStore } from "@/store/lang-store";
import { t as translate, L as pick } from "@/i18n/dictionary";
import type { DictKey } from "@/i18n/dictionary";
import type { Lang, LText } from "@/lib/types";

/** One hook for all localization needs.
 * t() and L() are reference-stable per language — safe to use in
 * useCallback/useEffect dependency arrays without re-triggering. */
export function useI18n() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const toggle = useLangStore((s) => s.toggle);

  const t = useCallback((key: DictKey) => translate(lang, key), [lang]);
  const L = useCallback((text: LText | undefined) => pick(text, lang), [lang]);

  return {
    lang,
    isBn: lang === "bn",
    setLang: setLang as (l: Lang) => void,
    toggle,
    t,
    L,
  };
}
