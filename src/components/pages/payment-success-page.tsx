"use client";

// ============================================================
// Payment success — celebration + receipt
// Reads ?tran=<tran_id>, idempotent verify returns the payment
// ============================================================

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { CrescentIcon } from "@/components/shared/core";
import { EASE, popBounce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentRecord, PayStatus } from "@/lib/types";

type State = "loading" | "done" | "error";

function fmtDate(d: string, lang: string) {
  try {
    return new Date(d).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

/* read current location.search as external store (hydration-safe) */
const searchSubscribe = () => () => {};
const getSearch = () => window.location.search;
const getSearchServer = () => "";

function useTranId() {
  const search = useSyncExternalStore(searchSubscribe, getSearch, getSearchServer);
  return new URLSearchParams(search).get("tran");
}

export function PaymentSuccessPage() {
  const { t, L, lang } = useI18n();
  const tran = useTranId();
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [state, setState] = useState<State>("loading");

  /* all setState calls happen after await — no cascading renders */
  const verify = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tran_id: id }),
      });
      const data = res.ok
        ? ((await res.json()) as { payment?: PaymentRecord })
        : null;
      if (!data?.payment) {
        setState("error");
        return;
      }
      setPayment(data.payment);
      setState("done");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (!tran) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) verify(tran);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tran, verify]);

  /* no tran in URL → straight to error view */
  const view: State = !tran && state === "loading" ? "error" : state;

  const success = payment?.status === "success";
  const pending = payment?.status === "pending" || payment?.status === "submitted";

  return (
    <div className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden px-4 py-10">
      {/* floating crescent confetti (tier-aware) */}
      {success && <CrescentConfetti />}

      {/* ---------- loading ---------- */}
      {view === "loading" && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 ring-1 ring-black/5">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-soft">
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* ---------- error / retry ---------- */}
      {view === "error" && (
        <motion.div
          variants={popBounce}
          initial="hidden"
          animate="show"
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-soft">
            <AlertTriangle className="h-7 w-7 text-brand-red" />
          </div>
          <p className="mt-4 font-bold">{t("error_generic")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "bn"
              ? "রসিদ লোড করা যায়নি — আবার চেষ্টা করুন।"
              : "Could not load your receipt — please retry."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {tran ? (
              <Button
                onClick={() => {
                  setState("loading");
                  verify(tran);
                }}
                className="h-11 w-full rounded-xl brand-gradient font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                {lang === "bn" ? "আবার চেষ্টা করুন" : "Retry"}
              </Button>
            ) : null}
            <Button asChild variant="ghost" className="rounded-xl font-semibold">
              <Link href="/payments">
                <ArrowLeft className="h-4 w-4" />
                {t("nav_payments")}
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* ---------- done ---------- */}
      {view === "done" && payment && (
        <motion.div
          variants={popBounce}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-md"
        >
          {/* success circle */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.1 }}
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full shadow-lg",
                success
                  ? "green-gradient shadow-brand-green/30"
                  : pending
                    ? "bg-amber-400 shadow-amber-400/30"
                    : "bg-brand-red shadow-brand-red/30"
              )}
            >
              {success ? (
                <svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden="true">
                  <motion.path
                    d="M14 27l8 8 16-16"
                    fill="none"
                    stroke="white"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
                  />
                </svg>
              ) : pending ? (
                <Clock className="h-9 w-9 text-white" />
              ) : (
                <AlertTriangle className="h-9 w-9 text-white" />
              )}
            </motion.div>
          </div>

          {/* thanks */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
            className="mt-5 text-center"
          >
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className={cn(success ? "text-brand-gradient" : "")}>
                {success ? t("pay_thanks_title") : pending ? t("pay_verify_wait") : t("pay_failed")}
              </span>
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {success
                ? t("pay_thanks_msg")
                : pending
                  ? lang === "bn"
                    ? "আপনার পেমেন্ট যাচাইয়ের অপেক্ষায় আছে — শীঘ্রই আপডেট পাবেন।"
                    : "Your payment is awaiting verification — you will get an update soon."
                  : lang === "bn"
                    ? "পেমেন্ট সম্পন্ন হয়নি — আইটেম পেজ থেকে আবার চেষ্টা করুন।"
                    : "Payment was not completed — retry from the item page."}
            </p>
          </motion.div>

          {/* receipt */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
            className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm"
          >
            <div className={cn("h-1.5 w-full", success ? "green-gradient" : "brand-gradient")} />
            <div className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("pay_receipt")}
              </p>
              <dl className="mt-3 divide-y divide-black/5">
                <Row label={t("pay_txn")}>
                  <span className="break-all text-right font-mono text-xs font-semibold">
                    {payment.tran_id}
                  </span>
                </Row>
                <Row label={lang === "bn" ? "আইটেম" : "Item"}>
                  <span className="text-right font-semibold">{L(payment.item_title)}</span>
                </Row>
                <Row label={t("ev_amount")}>
                  <span className="text-right font-extrabold text-brand-red">
                    ৳{payment.amount.toLocaleString("en-US")}
                  </span>
                </Row>
                <Row label={t("pay_method")}>
                  <span className="text-right font-semibold capitalize">{payment.method}</span>
                </Row>
                <Row label={t("pay_status")}>
                  <StatusChip status={payment.status} />
                </Row>
                <Row label={lang === "bn" ? "তারিখ" : "Date"}>
                  <span className="text-right text-xs font-semibold text-muted-foreground">
                    {fmtDate(payment.verified_at ?? payment.created_at, lang)}
                  </span>
                </Row>
              </dl>
            </div>
          </motion.div>

          {/* actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: EASE }}
            className="mt-6 flex flex-col gap-2.5"
          >
            <Button
              asChild
              className="h-11 w-full rounded-xl green-gradient font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href={`/payments/${payment.item_id}`}>
                <CheckCircle2 className="h-4 w-4" />
                {t("ev_done")}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-xl font-semibold">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                {t("pay_thanks_home")}
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- receipt row ---------------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

/* ---------------- status chip ---------------- */

function StatusChip({ status }: { status: PayStatus }) {
  const { t } = useI18n();
  const map: Record<PayStatus, { cls: string; label: string }> = {
    success: { cls: "bg-brand-green-soft text-brand-green", label: t("pay_success") },
    pending: { cls: "bg-amber-100 text-amber-700", label: t("pay_verify_wait") },
    submitted: { cls: "bg-amber-100 text-amber-700", label: t("pay_verify_wait") },
    failed: { cls: "bg-brand-red-soft text-brand-red", label: t("pay_failed") },
    refunded: { cls: "bg-black/[0.05] text-muted-foreground", label: t("pay_refunded") },
    due: { cls: "bg-amber-100 text-amber-700", label: t("paym_due") },
    cancelled: { cls: "bg-brand-red-soft text-brand-red", label: t("paym_cancelled") },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", s.cls)}>
      {status === "success" ? (
        <CheckCircle2 className="mr-1 h-3 w-3" />
      ) : status === "pending" || status === "submitted" ? (
        <Clock className="mr-1 h-3 w-3" />
      ) : null}
      {s.label}
    </span>
  );
}

/* ---------------- floating crescent confetti ---------------- */

function CrescentConfetti() {
  const tier = useDeviceTier();
  if (tier === "low") return null;
  const count = tier === "high" ? 14 : 8;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${(i * 53 + 7) % 100}%`, top: -40 }}
          initial={{ y: -60, opacity: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            opacity: [0, 1, 1, 0],
            rotate: i % 2 ? 220 : -220,
          }}
          transition={{
            duration: 4.5 + (i % 5),
            repeat: Infinity,
            delay: i * 0.4,
            ease: "linear",
          }}
        >
          <CrescentIcon
            className={cn(
              "h-5 w-5",
              i % 3 === 0 ? "text-brand-green" : "text-brand-red",
              i % 2 ? "h-7 w-7" : "h-4 w-4"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}
