"use client";

// ============================================================
// Global Emergency Popup — the "3-second protected cancel" alert.
// Polls /api/emergency/feed every 45s; shows queued alerts.
// Cancel button unlocks after exactly 3 seconds (user requirement).
// ============================================================

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { CrescentIcon } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useLangStore } from "@/store/lang-store";
import { cn } from "@/lib/utils";
import type { FeedAlert } from "@/lib/types";
import { subscribeToBroadcasts } from "@/lib/supabase/browser";

interface EmergencyCtx {
  /** trigger a manual check (used after signup/login/broadcast) */
  refresh: () => void;
}

const Ctx = createContext<EmergencyCtx>({ refresh: () => {} });
export const useEmergency = () => useContext(Ctx);

const DISMISS_KEY = "rcy-dismissed-alerts";
const POLL_MS = 45_000;
const CANCEL_LOCK_MS = 3000;

export function EmergencyPopupProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<FeedAlert[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const lang = useLangStore((s) => s.lang);
  const t = useI18n().t;

  const loadDismissed = useCallback((): Set<string> => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? "[]"));
    } catch {
      return new Set();
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/emergency/feed", { cache: "no-store" });
      const data = (await res.json()) as { alerts: FeedAlert[] };
      const dismissed = loadDismissed();
      const fresh = (data.alerts ?? []).filter(
        (a) => !seen.current.has(a.id) && !dismissed.has(a.id)
      );
      if (!fresh.length) return;
      fresh.forEach((a) => seen.current.add(a.id));
      setQueue((q) => {
        const ids = new Set(q.map((x) => x.id));
        const merged = [...q, ...fresh.filter((f) => !ids.has(f.id))];
        const rank = { critical: 0, high: 1 } as const;
        merged.sort(
          (a, b) =>
            rank[a.severity] - rank[b.severity] ||
            b.created_at.localeCompare(a.created_at)
        );
        return merged;
      });
    } catch {
      /* network hiccup — retry next cycle */
    }
  }, [loadDismissed]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  // re-poll on route change (spreads awareness across every page)
  useEffect(() => {
    poll();
  }, [pathname]);

  const dismiss = useCallback(
    (id: string) => {
      const dismissed = loadDismissed();
      dismissed.add(id);
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed]));
      setQueue((q) => q.filter((a) => a.id !== id));
    },
    [loadDismissed]
  );

  const refresh = useCallback(() => {
    seen.current.clear();
    poll();
  }, [poll]);

  // --- Supabase Realtime (ADDITIVE) — instant refresh on broadcasts writes ---
  // Subscribes once to public.broadcasts (anon + RLS). Bursts of events are
  // debounced 1500ms into a single refresh. Purely fail-safe: if realtime is
  // unavailable this resolves to a noop and the 45s polling keeps working.
  const realtimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBroadcasts(() => {
      if (realtimeTimer.current) clearTimeout(realtimeTimer.current);
      realtimeTimer.current = setTimeout(() => refresh(), 1500);
    });
    return () => {
      if (realtimeTimer.current) clearTimeout(realtimeTimer.current);
      realtimeTimer.current = null;
      unsubscribe();
    };
  }, [refresh]);

  const current = queue.length ? queue[0] : null;

  return (
    <Ctx.Provider value={{ refresh }}>
      {children}
      <AnimatePresence>
        {current && (
          <AlertCard
            key={current.id}
            alert={current}
            lang={lang}
            popLive={t("pop_live")}
            cancelLabel={t("pop_cancel")}
            cancelInLabel={t("pop_cancel_in")}
            detailsLabel={t("pop_details")}
            onDismiss={dismiss}
          />
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

/* ============================================================ */

function AlertCard({
  alert,
  lang,
  popLive,
  cancelLabel,
  cancelInLabel,
  detailsLabel,
  onDismiss,
}: {
  alert: FeedAlert;
  lang: "en" | "bn";
  popLive: string;
  cancelLabel: string;
  cancelInLabel: string;
  detailsLabel: string;
  onDismiss: (id: string) => void;
}) {
  // 3-second protected cancel — countdown owned here, resets per alert
  const [lockLeft, setLockLeft] = useState(CANCEL_LOCK_MS / 1000);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const timer = setTimeout(() => setLockLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [lockLeft]);

  const critical = alert.severity === "critical";

  return (
    <motion.div
      className="fixed inset-x-3 bottom-3 z-[100] max-w-[calc(100vw-24px)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]"
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      role="alertdialog"
      aria-live="assertive"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border shadow-2xl bg-white",
          critical ? "border-brand-red/40" : "border-orange-300"
        )}
      >
        {/* header strip */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-white",
            critical ? "brand-gradient" : "bg-orange-500"
          )}
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
          </span>
          <p className="text-xs font-bold tracking-[0.18em] animate-blink">{popLive}</p>
          <span className="ml-auto text-[10px] font-semibold uppercase opacity-90">
            {alert.source.replace("auto:", "")}
          </span>
        </div>

        <div className="flex gap-3 p-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              critical ? "bg-brand-red-soft text-brand-red" : "bg-orange-100 text-orange-600"
            )}
          >
            <AppIcon
              name={
                alert.source === "auto:earthquake" ? "Activity"
                : alert.source === "auto:flood" ? "Waves"
                : alert.source === "request" ? "Ambulance"
                : "Megaphone"
              }
              className="h-6 w-6"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug">
              {lang === "bn" ? alert.title.bn : alert.title.en}
            </p>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {lang === "bn" ? alert.body.bn : alert.body.en}
            </p>
            {alert.link && (
              <a
                href={alert.link}
                onClick={() => onDismiss(alert.id)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
              >
                <AppIcon name="ArrowRight" className="h-3.5 w-3.5" />
                {detailsLabel}
              </a>
            )}
          </div>
        </div>

        {/* protected cancel */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CrescentIcon className="h-3.5 w-3.5 text-brand-green" />
            <span>Youth Red Crescent — RPI</span>
          </div>
          <Button
            size="sm"
            variant={critical ? "destructive" : "outline"}
            disabled={lockLeft > 0}
            onClick={() => onDismiss(alert.id)}
            className={cn("min-w-24 font-semibold transition-all", lockLeft > 0 && "opacity-60")}
          >
            {lockLeft > 0 ? (
              <span className="flex items-center gap-2">
                <motion.span
                  key={lockLeft}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold"
                >
                  {lockLeft}
                </motion.span>
                {cancelInLabel}
              </span>
            ) : (
              <>
                <AppIcon name="X" className="mr-1.5 h-3.5 w-3.5" />
                {cancelLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
