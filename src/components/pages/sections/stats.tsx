"use client";

// ============================================================
// Home — Animated count-up stat cards (4)
// REAL data from the database via /api/public-stats
// ============================================================

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { Reveal, RevealGroup } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import type { DictKey } from "@/i18n/dictionary";
import { cn } from "@/lib/utils";

interface StatDef {
  value: number;
  suffix: string;
  key: DictKey;
  icon: string;
  accent: "red" | "green";
}

const STAT_DEFS: Omit<StatDef, "value">[] = [
  { suffix: "+", key: "stats_members", icon: "Users", accent: "red" },
  { suffix: "+", key: "stats_events", icon: "ClipboardList", accent: "green" },
  { suffix: "+", key: "stats_blood", icon: "Droplets", accent: "red" },
  { suffix: "+", key: "stats_hours", icon: "Clock", accent: "green" },
];

interface PublicStats {
  active_members: number;
  events_completed: number;
  blood_bags: number;
  volunteer_hours: number;
}

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const tier = useDeviceTier();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (tier === "low" || !inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, tier]);

  const shown = tier === "low" ? value : display;
  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString("en-US")}
      <span className="text-brand-red">{suffix}</span>
    </span>
  );
}

export function Stats() {
  const { t } = useI18n();
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/public-stats", { cache: "no-store" });
        const data = await res.json();
        if (alive && res.ok && data.stats) setStats(data.stats as PublicStats);
      } catch {
        /* fail-safe: keep previous state */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const values: number[] = stats
    ? [stats.active_members, stats.events_completed, stats.blood_bags, stats.volunteer_hours]
    : [0, 0, 0, 0];

  return (
    <section aria-label={t("stats_members")} className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STAT_DEFS.map((def, i) => (
          <Reveal key={def.key} index={i}>
            <div
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6",
              )}
            >
              {/* corner accent */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 top-0 h-1 brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  def.accent === "green" && "green-gradient"
                )}
              />
              <span
                className={cn(
                  "mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                  def.accent === "red"
                    ? "bg-brand-red-soft text-brand-red"
                    : "bg-brand-green-soft text-brand-green-dark"
                )}
              >
                <AppIcon name={def.icon} className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                <CountUp value={values[i]} suffix={def.suffix} />
              </div>
              <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {t(def.key)}
              </p>
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
