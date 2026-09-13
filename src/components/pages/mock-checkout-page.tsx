"use client";

// ============================================================
// Mock checkout — "RCY Secure Pay" demo gateway page
// Reads ?ref=<tran_id>, posts verify { mock: success | fail }
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CreditCard,
  Info,
  Loader2,
  LogIn,
  Phone,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { EASE, popBounce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentRecord } from "@/lib/types";

type State = "loading" | "ready" | "notfound" | "auth";

export function MockCheckoutPage() {
  const { t, L, lang } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [busy, setBusy] = useState<null | "pay" | "fail">(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (!ref) throw new Error("no_ref");
        const res = await fetch("/api/payments", { cache: "no-store" });
        if (!alive) return;
        if (res.status === 401) {
          setState("auth");
          return;
        }
        if (!res.ok) throw new Error("bad_response");
        const data = (await res.json()) as { payments?: PaymentRecord[] };
        const found = (data.payments ?? []).find((p) => p.tran_id === ref);
        if (!alive) return;
        if (!found) {
          setState("notfound");
          return;
        }
        setPayment(found);
        setState("ready");
      } catch {
        if (alive) setState("notfound");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const verify = async (mock: "success" | "fail") => {
    if (!payment || busy) return;
    setBusy(mock === "success" ? "pay" : "fail");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tran_id: payment.tran_id, mock }),
      });
      const data = (await res.json()) as { verified?: boolean; payment?: PaymentRecord };
      if (res.ok && data.verified && data.payment) {
        toast.success(t("pay_success"));
        router.replace(`/payment/success?tran=${payment.tran_id}`);
      } else {
        toast.error(t("pay_failed"));
        router.replace(`/payments/${payment.item_id}?status=fail`);
      }
    } catch {
      toast.error(t("error_generic"));
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-brand-red-soft/40 px-4 py-10">
      {/* ---------- loading ---------- */}
      {state === "loading" && (
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <Skeleton className="h-16 w-full rounded-none" />
            <div className="space-y-4 p-6">
              <Skeleton className="mx-auto h-12 w-40 rounded-xl" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* ---------- auth required ---------- */}
      {state === "auth" && (
        <motion.div
          variants={popBounce}
          initial="hidden"
          animate="show"
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-soft">
            <LogIn className="h-7 w-7 text-brand-red" />
          </div>
          <p className="mt-4 font-bold">
            {lang === "bn" ? "সেশন শেষ হয়ে গেছে" : "Session expired"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "bn"
              ? "পেমেন্ট সম্পন্ন করতে আবার লগইন করুন।"
              : "Please login again to complete your payment."}
          </p>
          <Button asChild className="mt-5 h-11 w-full rounded-xl brand-gradient font-bold text-white">
            <a href="/login">{t("nav_login")}</a>
          </Button>
        </motion.div>
      )}

      {/* ---------- not found ---------- */}
      {state === "notfound" && (
        <motion.div
          variants={popBounce}
          initial="hidden"
          animate="show"
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-soft">
            <XCircle className="h-7 w-7 text-brand-red" />
          </div>
          <p className="mt-4 font-bold">
            {lang === "bn" ? "ট্রানজেকশন পাওয়া যায়নি" : "Transaction not found"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "bn"
              ? "এই লিংকটি সম্ভবত পুরোনো বা ভুল।"
              : "This checkout link is probably old or invalid."}
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-xl font-semibold">
            <a href="/payments">{t("nav_payments")}</a>
          </Button>
        </motion.div>
      )}

      {/* ---------- checkout card ---------- */}
      {state === "ready" && payment && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5"
        >
          {/* gateway header */}
          <div className="brand-gradient relative flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ShieldCheck className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="text-sm font-extrabold tracking-wide text-white">RCY Secure Pay</p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">
                  Payment Gateway
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-amber-950">
              DEMO GATEWAY
            </span>
          </div>

          <div className="p-6">
            {/* amount */}
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 16 }}
              className="text-center text-5xl font-extrabold tracking-tight text-brand-red"
            >
              ৳{payment.amount.toLocaleString("en-US")}
            </motion.p>

            {/* payer + item */}
            <div className="mt-4 space-y-1.5 text-center">
              <p className="text-sm font-semibold">{payment.member_name}</p>
              <p className="text-sm text-muted-foreground">{L(payment.item_title)}</p>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                {t("pay_txn")}: {payment.tran_id}
              </p>
            </div>

            {/* fake payment methods */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-5 flex items-center justify-center gap-3"
            >
              {[
                { icon: CreditCard, label: lang === "bn" ? "কার্ড" : "Card" },
                { icon: Wallet, label: lang === "bn" ? "ওয়ালেট" : "Wallet" },
                { icon: Phone, label: lang === "bn" ? "মোবাইল" : "Mobile" },
              ].map((m, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <m.icon className="h-3.5 w-3.5 text-brand-red" />
                  {m.label}
                </span>
              ))}
            </motion.div>

            {/* demo note */}
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed text-amber-800">
                <p className="font-bold">{t("pay_mock_note")}</p>
                <p className="mt-0.5">
                  {lang === "bn"
                    ? "ডেমো মোড — গেটওয়ে কনফিগার হলে এখানে আসল পেমেন্ট পেজ আসবে"
                    : "Demo mode — real gateway page appears here once configured"}
                </p>
              </div>
            </div>

            {/* actions */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => verify("success")}
                disabled={busy !== null}
                className={cn(
                  "h-12 w-full rounded-xl green-gradient text-base font-bold text-white transition-transform",
                  "hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                )}
              >
                {busy === "pay" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {lang === "bn" ? "প্রসেসিং..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    {t("pay_paynow")}
                  </>
                )}
              </Button>
              <Button
                onClick={() => verify("fail")}
                disabled={busy !== null}
                variant="outline"
                className="h-11 w-full rounded-xl border-2 border-brand-red/30 font-semibold text-brand-red hover:bg-brand-red-soft"
              >
                {busy === "fail" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {lang === "bn" ? "প্রসেসিং..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {t("pay_fail_sim")}
                  </>
                )}
              </Button>
            </div>

            {/* footer */}
            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
              {lang === "bn"
                ? "২৫৬-বিট এনক্রিপ্টেড সুরক্ষিত সংযোগ"
                : "Secured with 256-bit encrypted connection"}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
