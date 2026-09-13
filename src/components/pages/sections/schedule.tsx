"use client";

// ============================================================
// Home — Weekly schedule (today-highlighted routine list)
// Data: /api/schedule (admin-managed DB rows) — falls back to
// the built-in WEEKLY_SCHEDULE while loading / on error / empty.
// ============================================================

import { useEffect, useState, useSyncExternalStore } from "react";
import { Reveal, RevealGroup, SectionHeading } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { WEEKLY_SCHEDULE } from "@/data/static";
import type {
  HomeSectionCfg,
  LText,
  ScheduleDay,
  ScheduleRow,
} from "@/lib/types";
import type { DictKey } from "@/i18n/dictionary";
import { cn } from "@/lib/utils";

/** WEEKLY_SCHEDULE order: Sat, Sun, Mon, Tue, Wed, Thu (no Friday row) */
const STATIC_DAY_KEYS: ScheduleDay[] = ["sat", "sun", "mon", "tue", "wed", "thu"];

/** Static rows converted to the DB ScheduleRow shape (fallback data) */
const STATIC_SCHEDULE_ROWS: ScheduleRow[] = WEEKLY_SCHEDULE.map((row, i) => ({
  id: `static-${i}`,
  day: STATIC_DAY_KEYS[i] ?? "sat",
  time_text: row.time,
  activity: row.activity,
  place: row.place,
  icon: row.icon,
  sort: i,
  active: true,
  created_at: "",
}));

/**
 * JS getDay(): 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
 * → schedule day key (null on Friday — no scheduled row)
 */
function todayScheduleKey(day: number): ScheduleDay | null {
  if (day === 6) return "sat";
  if (day === 5) return null; // Friday — no scheduled row
  if (day === 0) return "sun";
  return (["mon", "tue", "wed", "thu"] as const)[day - 1] ?? null;
}

const subscribeNoop = () => () => {};
const clientTodayKey = () => todayScheduleKey(new Date().getDay());
const serverTodayKey = () => null;

export function Schedule({ cfg }: { cfg?: HomeSectionCfg }) {
  const { t, L } = useI18n();
  const title = cfg?.title ? L(cfg.title as LText) : t("sch_title");
  const subtitle = cfg?.subtitle ? L(cfg.subtitle as LText) : t("sch_sub");

  // SSR-safe today key: server snapshot = null (no highlight),
  // client snapshot computed after hydration (no setState-in-effect).
  const todayKey = useSyncExternalStore(
    subscribeNoop,
    clientTodayKey,
    serverTodayKey
  );

  const [dbRows, setDbRows] = useState<ScheduleRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/schedule", { cache: "no-store" });
        const data = (await res.json()) as { schedule?: ScheduleRow[] };
        if (alive) setDbRows(data.schedule ?? []);
      } catch {
        if (alive) setDbRows([]); // static fallback renders
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // While loading, on fetch error, or when the table is empty → static rows
  const rows = dbRows && dbRows.length > 0 ? dbRows : STATIC_SCHEDULE_ROWS;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <SectionHeading title={title} subtitle={subtitle} />

      <Reveal>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {/* header row (sm+) */}
          <div className="hidden grid-cols-[112px_128px_1fr_150px] gap-x-3 border-b border-black/5 bg-black/[0.02] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>{t("sch_day")}</span>
            <span>{t("sch_time")}</span>
            <span>{t("sch_activity")}</span>
            <span>{t("sch_place")}</span>
          </div>

          <RevealGroup className="divide-y divide-black/5">
            {rows.map((row, i) => {
              const isToday = row.day === todayKey;
              return (
                <Reveal key={row.id} index={i}>
                  <div
                    className={cn(
                      "grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 px-4 py-3.5 transition-colors sm:grid-cols-[112px_128px_1fr_150px] sm:px-5",
                      isToday ? "bg-brand-red-soft/50" : "hover:bg-black/[0.02]"
                    )}
                  >
                    {/* day chip */}
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold sm:text-xs",
                        isToday
                          ? "bg-brand-red text-white shadow-sm shadow-brand-red/30"
                          : "bg-brand-green-soft text-brand-green-dark"
                      )}
                    >
                      {t(("day_" + row.day) as DictKey)}
                    </span>

                    {/* time */}
                    <span className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground sm:justify-start sm:text-sm">
                      <AppIcon name="Clock" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                      {row.time_text}
                    </span>

                    {/* activity */}
                    <span className="col-span-2 flex items-center gap-2 text-sm font-semibold sm:col-span-1">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          isToday
                            ? "bg-brand-red text-white"
                            : "bg-brand-red-soft text-brand-red"
                        )}
                      >
                        <AppIcon name={row.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      {L(row.activity)}
                    </span>

                    {/* place */}
                    <span className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-1 sm:text-sm">
                      <AppIcon name="MapPin" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                      {L(row.place)}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </Reveal>
    </section>
  );
}
