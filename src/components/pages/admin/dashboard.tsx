"use client";

// ============================================================
// Admin Dashboard — 8 stat cards (stagger pop + animated counters),
// quick actions, recent payments & notices (two columns)
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Megaphone,
  Plus,
  Radio,
  RefreshCw,
  Siren,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { useAuth } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EASE, popBounce, staggerParent } from "@/lib/motion";
import type { LText, Notice, PaymentRecord, PayStatus } from "@/lib/types";

interface Stats {
  members_total: number;
  members_active: number;
  notices_total: number;
  emergencies_open: number;
  broadcasts_active: number;
  items_active: number;
  events_active: number;
  collections_total: number;
  payments_verified: number;
  payments_pending: number;
  items_with_due: number;
  paid_coverage: number;
}

const T_WELCOME: LText = { en: "Welcome back", bn: "স্বাগতম" };
const T_OVERVIEW: LText = {
  en: "Everything about the unit at a glance",
  bn: "ইউনিটের সব কিছুর এক নজরে সারসংক্ষেপ",
};
const T_MEMBERS: LText = { en: "Members", bn: "সদস্য" };
const T_MEMBERS_SUB: LText = { en: "active of total", bn: "মোটের মধ্যে সক্রিয়" };
const T_EVENTS: LText = { en: "Active events", bn: "চালু ইভেন্ট" };
const T_EMERG: LText = { en: "Open emergencies", bn: "খোলা ইমার্জেন্সি" };
const T_EMERG_SUB: LText = {
  en: "Needs volunteer response",
  bn: "স্বেচ্ছাসেবীদের প্রয়োজন",
};
const T_COLLECTION: LText = { en: "Total collected", bn: "মোট সংগ্রহ" };
const T_COLLECTION_SUB: LText = { en: "verified payments", bn: "যাচাইকৃত পেমেন্ট" };
const T_VERIFIED: LText = { en: "Verified payments", bn: "যাচাইকৃত পেমেন্ট" };
const T_PENDING: LText = { en: "Pending payments", bn: "অপেক্ষমাণ পেমেন্ট" };
const T_PENDING_SUB: LText = {
  en: "Awaiting your review",
  bn: "আপনার যাচাইয়ের অপেক্ষায়",
};
const T_BROADCASTS: LText = { en: "Active broadcasts", bn: "সক্রিয় ব্রডকাস্ট" };
const T_BROADCASTS_SUB: LText = { en: "Popups live now", bn: "এখন পপআপ চালু" };
const T_COVERAGE: LText = { en: "Due coverage", bn: "বাকি পরিশোধের হার" };
const T_COVERAGE_SUB: LText = { en: "of items with due", bn: "বাকি আইটেমের মধ্যে" };
const T_QA: LText = { en: "Quick actions", bn: "দ্রুত কাজ" };
const T_QA_SUB: LText = {
  en: "Most used admin tasks — one click away",
  bn: "সবচেয়ে দরকারি কাজগুলো — এক ক্লিকে",
};
const T_QA_CREATE_SUB: LText = {
  en: "From template or custom",
  bn: "টেমপ্লেট থেকে বা কাস্টম",
};
const T_QA_PAY_SUB: LText = {
  en: "Check & verify member payments",
  bn: "সদস্যদের পেমেন্ট দেখুন ও ভেরিফাই করুন",
};
const T_RECENT_PAY: LText = { en: "Latest payments", bn: "সর্বশেষ পেমেন্ট" };
const T_RECENT_NOTICES: LText = { en: "Latest notices", bn: "সর্বশেষ নোটিশ" };
const T_VIEW_ALL: LText = { en: "View all", bn: "সব দেখুন" };
const T_EMPTY: LText = { en: "Nothing here yet", bn: "এখনো কিছু নেই" };

const STATUS_LABEL: Record<PayStatus, LText> = {
  pending: { en: "Pending", bn: "পেন্ডিং" },
  submitted: { en: "Submitted", bn: "জমা দেওয়া" },
  success: { en: "Paid", bn: "পরিশোধ" },
  failed: { en: "Failed", bn: "ব্যর্থ" },
  refunded: { en: "Refunded", bn: "ফেরত" },
  due: { en: "Due", bn: "বকেয়া" },
  cancelled: { en: "Cancelled", bn: "বাতিল" },
};

function statusCls(st: PayStatus): string {
  switch (st) {
    case "success":
      return "bg-brand-green-soft text-brand-green-dark";
    case "pending":
    case "submitted":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-brand-red-soft text-brand-red-dark";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** simple rAF count-up (skipped on low-tier devices) */
function CountUp({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const tier = useDeviceTier();
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (tier === "low") {
      // skip animation on low-tier devices (deferred to rAF to avoid sync setState)
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, tier]);
  return (
    <span>
      {prefix}
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

type Accent = "red" | "green" | "amber";

function StatCard({
  icon,
  label,
  sub,
  accent,
  blink,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  accent: Accent;
  blink?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={popBounce}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={cn(
        "rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5",
        blink && "ring-2 ring-brand-red/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            accent === "red" && "bg-brand-red-soft text-brand-red",
            accent === "green" && "bg-brand-green-soft text-brand-green",
            accent === "amber" && "bg-amber-100 text-amber-600"
          )}
        >
          {icon}
        </div>
        {blink && (
          <span
            className="h-2.5 w-2.5 rounded-full bg-brand-red animate-pulse-dot"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight">{children}</div>
      <p className="text-sm font-medium text-foreground/80">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export function AdminDashboard() {
  const { t, L, lang } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, pRes, nRes] = await Promise.all([
        fetch("/api/stats", { cache: "no-store" }),
        fetch("/api/payments?scope=all", { cache: "no-store" }),
        fetch("/api/notices", { cache: "no-store" }),
      ]);
      if (sRes.ok) setStats((await sRes.json()).stats ?? null);
      if (pRes.ok) setPayments((await pRes.json()).payments ?? []);
      if (nRes.ok) setNotices((await nRes.json()).notices ?? []);
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const manualRefresh = () => {
    setRefreshing(true);
    load();
  };

  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
    });

  const sevDot: Record<string, string> = {
    critical: "bg-brand-red animate-pulse-dot",
    high: "bg-orange-500",
    medium: "bg-amber-400",
    low: "bg-brand-green",
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* greeting */}
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
          {s(T_WELCOME)}
          {user?.full_name ? `, ${user.full_name}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground">{s(T_OVERVIEW)}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* stat cards */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label={s(T_MEMBERS)}
              sub={`${stats?.members_total ?? 0} ${s(T_MEMBERS_SUB)}`}
              accent="green"
            >
              <CountUp value={stats?.members_active ?? 0} />
            </StatCard>

            <StatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label={s(T_EVENTS)}
              accent="red"
            >
              <CountUp value={stats?.events_active ?? 0} />
            </StatCard>

            <StatCard
              icon={
                <Siren
                  className={cn("h-5 w-5", (stats?.emergencies_open ?? 0) > 0 && "animate-blink")}
                />
              }
              label={s(T_EMERG)}
              sub={s(T_EMERG_SUB)}
              accent="red"
              blink={(stats?.emergencies_open ?? 0) > 0}
            >
              <CountUp value={stats?.emergencies_open ?? 0} />
            </StatCard>

            <StatCard
              icon={<Wallet className="h-5 w-5" />}
              label={s(T_COLLECTION)}
              sub={`${stats?.payments_verified ?? 0} ${s(T_COLLECTION_SUB)}`}
              accent="green"
            >
              <CountUp value={stats?.collections_total ?? 0} prefix="৳" />
            </StatCard>

            <StatCard
              icon={<BadgeCheck className="h-5 w-5" />}
              label={s(T_VERIFIED)}
              accent="green"
            >
              <CountUp value={stats?.payments_verified ?? 0} />
            </StatCard>

            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label={s(T_PENDING)}
              sub={s(T_PENDING_SUB)}
              accent="amber"
            >
              <CountUp value={stats?.payments_pending ?? 0} />
            </StatCard>

            <StatCard
              icon={<Radio className="h-5 w-5" />}
              label={s(T_BROADCASTS)}
              sub={s(T_BROADCASTS_SUB)}
              accent="red"
            >
              <CountUp value={stats?.broadcasts_active ?? 0} />
            </StatCard>

            <StatCard
              icon={<Target className="h-5 w-5" />}
              label={s(T_COVERAGE)}
              sub={`${stats?.items_with_due ?? 0} ${s(T_COVERAGE_SUB)}`}
              accent="green"
            >
              <CountUp value={stats?.paid_coverage ?? 0} suffix="%" />
              <Progress
                value={stats?.paid_coverage ?? 0}
                className="mt-2 h-2 bg-muted [&>div]:bg-brand-green"
                aria-label={s(T_COVERAGE)}
              />
            </StatCard>
          </motion.div>

          {/* quick actions */}
          <section aria-label={s(T_QA)} className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="font-bold tracking-tight">{s(T_QA)}</h3>
                <p className="text-xs text-muted-foreground">{s(T_QA_SUB)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={manualRefresh}
                aria-label="Refresh"
                className="rounded-full text-muted-foreground"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/admin/events"
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl brand-gradient p-4 text-white shadow-sm ring-1 ring-black/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{t("adm_new_item")}</span>
                    <span className="block text-xs text-white/80">{s(T_QA_CREATE_SUB)}</span>
                  </span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/admin/broadcast"
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-red/20 hover:bg-brand-red-soft/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                    <Megaphone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-red-dark">
                      {t("adm_broadcast_title")}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t("adm_broadcast_sub")}
                    </span>
                  </span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/admin/payments"
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-green/20 hover:bg-brand-green-soft/50"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-soft text-brand-green">
                    <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    {(stats?.payments_pending ?? 0) > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        {stats?.payments_pending}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-green-dark">
                      {t("adm_verify")}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s(T_QA_PAY_SUB)}
                    </span>
                  </span>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* recent activity — two columns */}
          <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* payments */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold tracking-tight">{s(T_RECENT_PAY)}</h3>
                <Link
                  href="/admin/payments"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
                >
                  {s(T_VIEW_ALL)}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              <div className="nice-scroll max-h-72 space-y-1 overflow-y-auto pr-1">
                {payments.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.member_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{L(p.item_title)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">৳{p.amount.toLocaleString("en-US")}</p>
                      <span
                        className={cn(
                          "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                          statusCls(p.status)
                        )}
                      >
                        {s(STATUS_LABEL[p.status])}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">{s(T_EMPTY)}</p>
                )}
              </div>
            </div>

            {/* notices */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold tracking-tight">{s(T_RECENT_NOTICES)}</h3>
                <Link
                  href="/notices"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
                >
                  {s(T_VIEW_ALL)}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              <div className="nice-scroll max-h-72 space-y-1 overflow-y-auto pr-1">
                {notices.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        sevDot[n.severity] ?? "bg-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{L(n.title)}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</p>
                    </div>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">{s(T_EMPTY)}</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
