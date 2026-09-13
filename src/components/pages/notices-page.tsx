"use client";

// ============================================================
// Notices Page — Notice Board with search, category tabs,
// emergency zone (blinking urgent alerts) & clean general list
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Droplets,
  Pin,
  Search,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier, tierScale } from "@/hooks/use-device-tier";
import { BlinkDot, SeverityBadge } from "@/components/shared/core";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n/dictionary";
import type { FeedAlert, Notice, NoticeCategory } from "@/lib/types";

/** live feed alert -> emergency notice card (so /notices mirrors the homepage strip) */
function alertToNotice(a: FeedAlert): Notice {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    category: "emergency",
    severity: a.severity,
    is_pinned: false,
    show_popup: false,
    created_by: "system",
    created_at: a.created_at,
  };
}

/** drop feed alerts that duplicate an official notice with the same title */
function dedupe(feed: FeedAlert[], official: Notice[]): Notice[] {
  const seen = new Set(official.map((n) => n.title.en.trim().toLowerCase()));
  return feed
    .filter((a) => !seen.has(a.title.en.trim().toLowerCase()))
    .map(alertToNotice);
}

type TabKey = "all" | NoticeCategory;

const TABS: { key: TabKey; dict: DictKey }[] = [
  { key: "all", dict: "not_tab_all" },
  { key: "general", dict: "not_tab_general" },
  { key: "emergency", dict: "not_tab_emergency" },
  { key: "event", dict: "not_tab_event" },
  { key: "blood", dict: "not_tab_blood" },
];

const CAT_STYLE: Record<NoticeCategory, { bar: string; icon: LucideIcon; chip: string }> = {
  general: { bar: "bg-zinc-300", icon: Bell, chip: "bg-zinc-100 text-zinc-600" },
  event: { bar: "bg-brand-green", icon: CalendarDays, chip: "bg-brand-green-soft text-brand-green-dark" },
  blood: { bar: "bg-brand-red", icon: Droplets, chip: "bg-brand-red-soft text-brand-red" },
  emergency: { bar: "bg-brand-red", icon: Siren, chip: "bg-brand-red-soft text-brand-red" },
};

/** emergency-category notices + critical blood notices */
function isUrgent(n: Notice) {
  return n.category === "emergency" || (n.category === "blood" && n.severity === "critical");
}

export function NoticesPage() {
  const { t, L, lang } = useI18n();
  const tier = useDeviceTier();
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      // official notices + live emergency feed (same source as the homepage strip)
      const [nRes, fRes] = await Promise.allSettled([
        fetch("/api/notices", { cache: "no-store" }),
        fetch("/api/emergency/feed", { cache: "no-store" }),
      ]);
      if (!alive) return;
      const official: Notice[] =
        nRes.status === "fulfilled"
          ? ((await nRes.value.json().catch(() => ({}))) as { notices?: Notice[] }).notices ?? []
          : [];
      const alerts: FeedAlert[] =
        fRes.status === "fulfilled"
          ? ((await fRes.value.json().catch(() => ({}))) as { alerts?: FeedAlert[] }).alerts ?? []
          : [];
      setNotices([...dedupe(alerts, official), ...official]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: 0, general: 0, emergency: 0, event: 0, blood: 0 };
    for (const n of notices ?? []) {
      c.all += 1;
      c[n.category] += 1;
    }
    return c;
  }, [notices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (notices ?? []).filter((n) => {
      const catOk =
        tab === "all"
          ? true
          : tab === "emergency"
            ? isUrgent(n)
            : n.category === tab;
      if (!catOk) return false;
      if (!q) return true;
      return (
        n.title.en.toLowerCase().includes(q) ||
        n.title.bn.includes(q) ||
        n.body.en.toLowerCase().includes(q) ||
        n.body.bn.includes(q)
      );
    });
  }, [notices, tab, query]);

  const zoneOn = tab === "all" || tab === "emergency";
  const zoneItems = zoneOn ? filtered.filter(isUrgent) : [];
  const listItems = zoneOn ? filtered.filter((n) => !isUrgent(n)) : filtered;
  const showEmpty = zoneItems.length === 0 && listItems.length === 0;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: tierScale.stagger[tier], delayChildren: 0.04 },
    },
  };

  const noResult = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      {/* ---------- heading ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-red sm:text-4xl">
          {t("not_title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("not_sub")}</p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full brand-gradient" />
      </motion.div>

      {/* ---------- search ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="relative mt-6"
      >
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("not_search")}
          aria-label={t("not_search")}
          className="h-11 rounded-2xl bg-white pl-10 ring-1 ring-black/5"
        />
      </motion.div>

      {/* ---------- category tabs ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14 }}
        className="mt-4"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="nice-scroll h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl p-1.5">
            {TABS.map(({ key, dict }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex-none gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-sm"
              >
                {t(dict)}
                <span className="rounded-full bg-black/5 px-1.5 text-[10px] font-bold tabular-nums">
                  {counts[key]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ---------- loading skeleton ---------- */}
      {notices === null && (
        <div className="mt-6 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-shimmer h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {/* ---------- content ---------- */}
      {notices !== null && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
            className="mt-6"
          >
            {/* ===== emergency zone ===== */}
            {zoneOn && (
              <motion.section
                variants={fadeUp}
                aria-label={t("not_emergency_zone")}
                className="rounded-2xl border border-red-200 bg-brand-red-soft p-4 sm:p-5"
              >
                <div className="flex items-center gap-2">
                  <BlinkDot />
                  <Siren className="h-4 w-4 text-brand-red" aria-hidden="true" />
                  <h2 className="text-sm font-extrabold tracking-[0.16em] text-brand-red">
                    {t("not_emergency_zone")}
                  </h2>
                </div>

                {zoneItems.length === 0 ? (
                  /* all-safe empty state */
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-green-soft p-4 ring-1 ring-black/5">
                    <ShieldCheck className="h-7 w-7 shrink-0 text-brand-green" aria-hidden="true" />
                    <p className="text-sm font-semibold text-brand-green-dark">
                      {t("strip_empty")}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {zoneItems.map((n) => (
                      <motion.article
                        key={n.id}
                        variants={fadeUp}
                        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="animate-blink text-sm font-bold text-brand-red sm:text-base">
                            {L(n.title)}
                          </h3>
                          <SeverityBadge severity={n.severity} />
                          {n.is_pinned && (
                            <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100">
                              <Pin className="mr-1 h-3 w-3" aria-hidden="true" />
                              {t("not_pinned")}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {L(n.body)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-zinc-400">
                          {fmtDate(n.created_at)}
                        </p>
                      </motion.article>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* ===== general list ===== */}
            <div className={cn("grid gap-3", zoneOn && "mt-4")}>
              {listItems.map((n) => {
                const style = CAT_STYLE[n.category];
                const Icon = style.icon;
                return (
                  <motion.article
                    key={n.id}
                    variants={fadeUp}
                    className="relative overflow-hidden rounded-2xl bg-white p-4 pl-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
                  >
                    <span
                      className={cn("absolute inset-y-0 left-0 w-1.5", style.bar)}
                      aria-hidden="true"
                    />
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          style.chip
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold leading-snug">{L(n.title)}</h3>
                          {n.severity !== "low" && <SeverityBadge severity={n.severity} />}
                          {n.is_pinned && (
                            <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 hover:bg-amber-100">
                              <Pin className="mr-1 h-3 w-3" aria-hidden="true" />
                              {t("not_pinned")}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {L(n.body)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-zinc-400">
                          {fmtDate(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}

              {/* empty state */}
              {showEmpty && (
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col items-center rounded-2xl bg-white p-10 text-center ring-1 ring-black/5"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-soft">
                    <Bell className="h-7 w-7 text-brand-green" aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-bold">
                    {noResult
                      ? lang === "bn"
                        ? "কিছু পাওয়া যায়নি — অন্য শব্দে খুঁজে দেখুন"
                        : "Nothing matched your search"
                      : lang === "bn"
                        ? "এখন কোনো নোটিশ নেই"
                        : "No notices yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {noResult
                      ? lang === "bn"
                        ? "বানান বদলে আবার চেষ্টা করুন"
                        : "Try a different keyword"
                      : lang === "bn"
                        ? "নতুন নোটিশ এখানে দেখা যাবে"
                        : "New notices will appear here"}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
