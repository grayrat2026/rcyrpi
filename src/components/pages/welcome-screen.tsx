"use client";

// ============================================================
// Welcome Screen — full-screen celebration after successful
// signup: brand gradient, falling crescent confetti, animated
// check mark, auto redirect countdown (tier-aware)
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CrescentIcon } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { cn } from "@/lib/utils";

interface Confetti {
  left: number;
  delay: number;
  dur: number;
  sizeCls: string;
  red: boolean;
}

export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n();
  const tier = useDeviceTier();
  const [left, setLeft] = useState(6);

  // countdown → auto redirect
  useEffect(() => {
    const iv = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);

  // falling crescents — fewer on weaker devices, none on low tier
  const confetti = useMemo<Confetti[]>(() => {
    if (tier === "low") return [];
    const n = tier === "high" ? 8 : 5;
    const sizeCls = ["h-4 w-4", "h-6 w-6", "h-8 w-8"];
    return Array.from({ length: n }).map((_, i) => ({
      left: (i * 131) % 100,
      delay: (i % 5) * 0.7,
      dur: 5.5 + (i % 4) * 1.4,
      sizeCls: sizeCls[i % 3],
      red: i % 2 === 0,
    }));
  }, [tier]);

  return (
    <motion.div
      className="brand-gradient fixed inset-0 z-[300] flex items-center justify-center overflow-hidden px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-modal="true"
      aria-label={t("welcome_title")}
    >
      {/* falling crescent confetti */}
      {confetti.map((c, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute top-0"
          style={{ left: `${c.left}%` }}
          initial={{ y: "-12vh", rotate: 0, opacity: 0 }}
          animate={{ y: "112vh", rotate: 340, opacity: [0, 1, 1, 0.85] }}
          transition={{
            duration: c.dur,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          aria-hidden="true"
        >
          <CrescentIcon
            className={cn(c.sizeCls, c.red ? "text-white/80" : "text-white/45")}
          />
        </motion.span>
      ))}

      {/* center card */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 44 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
        className="relative w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-black/10"
      >
        {/* animated green check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-soft"
        >
          <svg viewBox="0 0 52 52" className="h-12 w-12" aria-hidden="true">
            <motion.path
              d="M14 27 L23 36 L38 18"
              fill="none"
              stroke="#00734a"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-brand-red sm:text-3xl">
          {t("welcome_title")}
        </h1>
        <p className="mt-2 text-base font-bold leading-snug">{t("welcome_msg")}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("welcome_sub")}</p>

        {/* red crescent divider */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="h-px w-10 bg-border" aria-hidden="true" />
          <CrescentIcon className="animate-heartbeat h-5 w-5 text-brand-red" />
          <span className="h-px w-10 bg-border" aria-hidden="true" />
        </div>

        <Button
          onClick={onDone}
          className="brand-gradient mt-5 h-11 w-full rounded-xl text-base font-bold text-white hover:opacity-95"
        >
          {t("welcome_go")}
        </Button>

        <p className="mt-3 text-[11px] font-medium text-muted-foreground" aria-live="polite">
          {lang === "bn"
            ? `${Math.max(left, 0)} সেকেন্ডে স্বয়ংক্রিয় রিডাইরেক্ট...`
            : `Auto redirect in ${Math.max(left, 0)}s...`}
        </p>
      </motion.div>
    </motion.div>
  );
}
