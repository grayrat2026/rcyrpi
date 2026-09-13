"use client";

// ============================================================
// Payments listing — events / donations / gifts with pay status
// ============================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  HandHeart,
  LogIn,
  MapPin,
  Wallet,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { AppIcon } from "@/components/shared/app-icon";
import { fadeUp, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item, ItemKind, PaymentRecord } from "@/lib/types";

type TabKey = "all" | ItemKind;

const KIND_META: Record<
  ItemKind,
  { bn: string; en: string; icon: string; iconCls: string }
> = {
  event: { bn: "ইভেন্ট", en: "Event", icon: "CalendarDays", iconCls: "bg-brand-red-soft text-brand-red" },
  donation: { bn: "ডোনেশন", en: "Donation", icon: "HandHeart", iconCls: "bg-brand-green-soft text-brand-green" },
  gift: { bn: "গিফট", en: "Gift", icon: "Gift", iconCls: "bg-amber-50 text-amber-600" },
};

const TAB_LABEL: Record<TabKey, { bn: string; en: string }> = {
  all: { bn: "সব", en: "All" },
  event: { bn: "ইভেন্ট", en: "Events" },
  donation: { bn: "ডোনেশন", en: "Donations" },
  gift: { bn: "গিফট", en: "Gifts" },
};

const EMPTY_PAYMENTS: PaymentRecord[] = [];

function fmtDate(d: string, lang: string) {
  try {
    return new Date(d).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function PaymentsPage() {
  const { t, L, lang } = useI18n();
  const { user } = useAuth();
  const tier = useDeviceTier();
  const reduce = useReducedMotion();
  const lite = tier === "low" || reduce;

  const [items, setItems] = useState<Item[] | null>(null);
  const [myPayments, setMyPayments] = useState<PaymentRecord[]>([]);
  const [tab, setTab] = useState<TabKey>("all");

  /* payments only meaningful for logged-in member */
  const payments = user ? myPayments : EMPTY_PAYMENTS;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = (await res.json()) as { items?: Item[] };
        if (alive) setItems(data.items ?? []);
      } catch {
        if (alive) {
          setItems([]);
          toast.error(t("error_generic"));
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/payments", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { payments?: PaymentRecord[] };
        if (alive) setMyPayments(data.payments ?? []);
      } catch {
        /* silent — paid state just stays unverified */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  /** member has a successful payment for this item */
  const paidIds = useMemo(
    () =>
      new Set(
        payments
          .filter((p) => p.status === "success")
          .map((p) => p.item_id)
      ),
    [payments]
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: 0, event: 0, donation: 0, gift: 0 };
    for (const it of items ?? []) {
      c.all += 1;
      c[it.kind] += 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(
    () => (items ?? []).filter((it) => tab === "all" || it.kind === tab),
    [items, tab]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      {/* ---- heading ---- */}
      <motion.div
        initial={lite ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient shadow-lg shadow-brand-red/25">
          <Wallet className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-brand-gradient">{t("pay_title")}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {t("pay_sub")}
        </p>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full brand-gradient" />
      </motion.div>

      {/* ---- tabs ---- */}
      <motion.div
        initial={lite ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mt-8 flex justify-center"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="h-auto w-full flex-wrap justify-center gap-1 rounded-2xl bg-black/[0.04] p-1.5 sm:w-auto">
            {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all data-[state=active]:bg-white data-[state=active]:text-brand-red data-[state=active]:shadow-sm sm:px-4"
              >
                {lang === "bn" ? TAB_LABEL[k].bn : TAB_LABEL[k].en}
                <span className="ml-1.5 rounded-full bg-brand-red/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-red">
                  {counts[k]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ---- grid ---- */}
      <div className="mt-8">
        {items === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
            <AppIcon name="Bell" className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {lang === "bn" ? "এই ট্যাবে কোনো আইটেম নেই" : "No items in this tab yet"}
            </p>
          </div>
        ) : lite ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => (
              <ItemCard
                key={item.id}
                item={item}
                index={i}
                paid={paidIds.has(item.id)}
                isUser={!!user}
                animate={false}
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              variants={staggerParent}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -10, transition: { duration: 0.16 } }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((item, i) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  paid={paidIds.has(item.id)}
                  isUser={!!user}
                  animate
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ---------------- item card ---------------- */

function ItemCard({
  item,
  index,
  paid,
  isUser,
  animate,
}: {
  item: Item;
  index: number;
  paid: boolean;
  isUser: boolean;
  animate: boolean;
}) {
  const { t, L, lang } = useI18n();
  const kind = KIND_META[item.kind] ?? KIND_META.event;

  const daysLeft = item.deadline
    ? Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400000)
    : null;
  const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft < 3;
  const cancelled = item.status === "cancelled";
  const postponed = item.status === "postponed";

  const cls = cn("h-full", cancelled && "grayscale opacity-80");

  const body = (
    <article
      className="group flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5"
    >
        {/* icon + kind chip */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
              kind.iconCls
            )}
          >
            <AppIcon name={item.icon || kind.icon} className="h-7 w-7" />
          </div>
          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {lang === "bn" ? kind.bn : kind.en}
          </span>
        </div>

        {/* title + desc */}
        <h3 className="mt-4 text-base font-bold leading-snug">{L(item.title)}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {L(item.description)}
        </p>

        {/* meta */}
        <div className="mt-4 space-y-2 text-sm">
          {item.deadline && (
            <div>
              {closingSoon ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-2.5 py-1 text-xs font-bold text-white animate-blink">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {lang === "bn" ? "শীঘ্রই শেষ" : "Closing soon"} · {fmtDate(item.deadline, lang)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-red/70" />
                  <span className="font-medium">{t("ev_deadline")}:</span> {fmtDate(item.deadline, lang)}
                </span>
              )}
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-brand-red/70" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>

        {/* amount + status */}
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {item.amount > 0 ? (
              <span className="text-xl font-extrabold text-brand-red">
                ৳{item.amount.toLocaleString("en-US")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-brand-green-soft px-2.5 py-1 text-xs font-bold text-brand-green">
                {t("ev_free")}
              </span>
            )}
            {postponed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                {t("ev_postponed")}
              </span>
            )}
            {cancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-red-soft px-2.5 py-1 text-[11px] font-bold text-brand-red">
                <XCircle className="h-3 w-3" />
                {t("ev_cancelled")}
              </span>
            )}
          </div>
          {postponed && item.postpone_note && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              {L(item.postpone_note)}
            </p>
          )}

          {/* CTA */}
          <div className="mt-4">
            {!item.payment_required ? (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl font-semibold transition-all hover:border-brand-red/30 hover:text-brand-red"
              >
                <Link href={`/payments/${item.id}`}>{t("ev_details")}</Link>
              </Button>
            ) : paid ? (
              <Button
                disabled
                className="w-full cursor-default rounded-xl green-gradient font-semibold text-white opacity-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t("ev_done")}
              </Button>
            ) : isUser ? (
              <Button
                asChild
                className="w-full rounded-xl brand-gradient font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link href={`/payments/${item.id}`}>
                  <CreditCard className="h-4 w-4" />
                  {t("pay_continue")}
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl font-semibold text-brand-red hover:border-brand-red/40 hover:bg-brand-red-soft"
              >
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  {t("nav_login")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </article>
  );

  return animate ? (
    <motion.div variants={fadeUp} custom={index} className={cls}>
      {body}
    </motion.div>
  ) : (
    <div className={cls}>{body}</div>
  );
}
