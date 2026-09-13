"use client";

// ============================================================
// Pay product page — shareable payment link target (/pay/{id})
// Site theme & UX: product card + secure checkout CTA.
// Flow: POST /api/payments/checkout -> PUT /api/payments/pending
//       -> redirect (gateway or themed fallback checkout)
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { fadeUp, staggerParent } from "@/lib/motion";
import type { Item } from "@/lib/types";

export function PayProductPage({ itemId }: { itemId: string }) {
  const { t, lang, L } = useI18n();
  const { user, refresh: refreshAuth } = useAuth();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const [item, setItem] = useState<Item | null | undefined>(undefined); // undefined = loading
  const [paying, setPaying] = useState(false);

  const [alreadyPaid] = useState(search?.get("paid") === "1");

  /* resolve auth silently */
  useEffect(() => {
    let alive = true;
    refreshAuth().finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [refreshAuth]);

  /* load the product */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setItem(res.ok ? (data.item as Item) : null);
      } catch {
        if (alive) setItem(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId]);

  const startPayment = useCallback(async () => {
    if (!item || paying) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });
      const data = (await res.json()) as {
        mode?: "gateway" | "mock";
        redirect_url?: string;
        tran_id?: string;
        error?: string;
      };
      if (!res.ok || !data.redirect_url || !data.tran_id) {
        toast.error(
          data.error === "login_required"
            ? lang === "bn"
              ? "পেমেন্ট করতে লগইন করুন"
              : "Please login to continue payment"
            : t("error_generic")
        );
        setPaying(false);
        return;
      }
      await fetch("/api/payments/pending", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tran_id: data.tran_id, item_id: item.id }),
      });
      window.location.href = data.redirect_url;
    } catch {
      toast.error(t("error_generic"));
      setPaying(false);
    }
  }, [item, paying, t, lang]);

  /* ---------------- loading ---------------- */
  if (item === undefined) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="mt-4 h-40 rounded-2xl" />
      </div>
    );
  }

  /* ---------------- not found / unavailable ---------------- */
  if (item === null || item.status === "cancelled") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"
        >
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-red" aria-hidden="true" />
          <p className="mt-3 font-bold">{t("pay_not_found")}</p>
          <Button asChild className="mt-5 rounded-full brand-gradient font-bold text-white">
            <Link href="/payments">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("nav_payments")}
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const free = item.amount <= 0;
  const mustLogin = ready && !user;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-brand-red/5 ring-1 ring-black/5"
      >
        {/* branded top band */}
        <div className="brand-gradient flex h-2 w-full" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          {/* icon + kind */}
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-soft text-brand-red ring-1 ring-black/5">
              <AppIcon name={item.icon} className="h-7 w-7" />
            </span>
            {item.status !== "active" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                {item.status === "postponed" ? t("ev_postponed") : item.status}
              </span>
            )}
          </motion.div>

          {/* title + desc */}
          <motion.div variants={fadeUp} className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("pay_for")}
            </p>
            <h1 className="mt-1 text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
              {L(item.title)}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {L(item.description)}
            </p>
          </motion.div>

          {/* amount */}
          <motion.div variants={fadeUp} className="mt-5 flex items-end justify-between rounded-2xl bg-muted/60 px-4 py-3.5 ring-1 ring-black/5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("ev_amount")}
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-brand-green-dark">
              {free ? t("ev_free") : `৳${item.amount.toLocaleString("en-US")}`}
            </span>
          </motion.div>

          {/* meta rows */}
          {(item.event_date || item.deadline || item.location) && (
            <motion.div variants={fadeUp} className="mt-4 space-y-2 text-sm text-muted-foreground">
              {item.event_date && (
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-red" aria-hidden="true" />
                  {t("ev_date")}: {fmtDate(item.event_date)}
                </p>
              )}
              {item.deadline && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-brand-red" aria-hidden="true" />
                  {t("ev_deadline")}: {fmtDate(item.deadline)}
                </p>
              )}
              {item.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-red" aria-hidden="true" />
                  {item.location}
                </p>
              )}
            </motion.div>
          )}

          {alreadyPaid && (
            <motion.div variants={fadeUp} className="mt-4 flex items-center gap-2 rounded-xl bg-brand-green-soft px-3 py-2.5 text-sm font-semibold text-brand-green-dark ring-1 ring-brand-green/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("pay_success")}
            </motion.div>
          )}

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-6">
            {mustLogin ? (
              <>
                <Button
                  asChild
                  className="h-12 w-full rounded-xl brand-gradient text-base font-bold text-white hover:opacity-95"
                >
                  <Link href={`/login?next=/pay/${item.id}`}>
                    <Lock className="h-4.5 w-4.5" aria-hidden="true" />
                    {t("pay_login_btn")}
                  </Link>
                </Button>
                <p className="mt-2.5 text-center text-xs text-muted-foreground">
                  {t("pay_login_first")}
                </p>
              </>
            ) : (
              <Button
                onClick={startPayment}
                disabled={paying || item.status !== "active" || free}
                className="h-12 w-full rounded-xl brand-gradient text-base font-bold text-white hover:opacity-95"
              >
                {paying ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                )}
                {paying ? t("pay_paying") : t("pay_now")}
              </Button>
            )}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t("pay_secure_note")}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
