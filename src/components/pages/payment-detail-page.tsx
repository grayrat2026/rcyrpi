"use client";

// ============================================================
// Payment detail — item info + sticky animated checkout card
// Flow: POST /checkout → PUT /pending → redirect_url
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { animate, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Link2,
  Loader2,
  LogIn,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { AppIcon } from "@/components/shared/app-icon";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item, ItemKind, PaymentRecord } from "@/lib/types";

const KIND_META: Record<ItemKind, { bn: string; en: string; icon: string }> = {
  event: { bn: "ইভেন্ট", en: "Event", icon: "CalendarDays" },
  donation: { bn: "ডোনেশন", en: "Donation", icon: "HandHeart" },
  gift: { bn: "গিফট", en: "Gift", icon: "Gift" },
};

const EMPTY_PAYMENTS: PaymentRecord[] = [];

/** animated number counter (৳) */
function AnimatedAmount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      if (ref.current) ref.current.textContent = value.toLocaleString("en-US");
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-US");
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span ref={ref}>0</span>;
}

function fmtDate(d: string, lang: string) {
  try {
    return new Date(d).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

/* read current location.search as external store (hydration-safe) */
const searchSubscribe = () => () => {};
const getSearch = () => window.location.search;
const getSearchServer = () => "";

function useQueryStatus() {
  const search = useSyncExternalStore(searchSubscribe, getSearch, getSearchServer);
  return useMemo(() => {
    const s = new URLSearchParams(search).get("status");
    return s === "fail" || s === "cancel" ? s : null;
  }, [search]);
}

export function PaymentDetailPage() {
  const { t, L, lang } = useI18n();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<Item | null | undefined>(undefined); // undefined = loading
  const [myPayments, setMyPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  /* gateway redirect status (?status=fail|cancel) */
  const failBanner = useQueryStatus();

  /* payments only meaningful for logged-in member */
  const payments = user ? myPayments : EMPTY_PAYMENTS;

  /* fetch item (list + find keeps it simple & cache-friendly) */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = (await res.json()) as { items?: Item[] };
        if (!alive) return;
        setItem(data.items?.find((it) => it.id === id) ?? null);
      } catch {
        if (alive) setItem(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /* fetch own payments (paid detection) */
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
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const myPaid = useMemo(
    () => payments.find((p) => p.item_id === id && p.status === "success"),
    [payments, id]
  );

  /* ---- checkout flow ---- */
  const startPayment = useCallback(async () => {
    if (!item || loading) return;
    setLoading(true);
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
        gateway_ref?: string;
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
        setLoading(false);
        return;
      }
      /* create pending record so verify can resolve it */
      await fetch("/api/payments/pending", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tran_id: data.tran_id,
          item_id: item.id,
          gateway_ref: data.gateway_ref,
        }),
      });
      toast.success(
        lang === "bn"
          ? "পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছে..."
          : "Redirecting to secure checkout..."
      );
      window.location.href = data.redirect_url;
    } catch {
      toast.error(t("error_generic"));
      setLoading(false);
    }
  }, [item, loading, t, lang]);

  /* ---------------- loading ---------------- */
  if (item === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ---------------- not found ---------------- */
  if (item === null) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5"
        >
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-red" />
          <p className="mt-3 font-bold">
            {lang === "bn" ? "আইটেমটি খুঁজে পাওয়া যায়নি" : "Item not found"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "bn"
              ? "এটি মুছে ফেলা হয়েছে বা লিংকটি ভুল।"
              : "It may have been removed, or the link is wrong."}
          </p>
          <Button asChild className="mt-5 rounded-xl brand-gradient font-semibold text-white">
            <Link href="/payments">
              <ArrowLeft className="h-4 w-4" />
              {t("nav_payments")}
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const kind = KIND_META[item.kind] ?? KIND_META.event;
  const cancelled = item.status === "cancelled";
  const postponed = item.status === "postponed";
  const free = item.amount <= 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      {/* back */}
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-red"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("nav_payments")}
      </Link>

      {/* fail / cancel banner from gateway redirect */}
      {failBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold text-amber-800">{t("pay_failed")}</p>
            <p className="mt-0.5 text-amber-700">
              {failBanner === "cancel"
                ? lang === "bn"
                  ? "পেমেন্ট বাতিল করা হয়েছে — চাইলে আবার চেষ্টা করতে পারেন।"
                  : "Payment was cancelled — you can try again anytime."
                : lang === "bn"
                  ? "পেমেন্ট ব্যর্থ হয়েছে — আবার চেষ্টা করুন।"
                  : "Payment failed — please try again."}
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* ================= left: info card ================= */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
                item.kind === "donation"
                  ? "bg-brand-green-soft text-brand-green"
                  : item.kind === "gift"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-brand-red-soft text-brand-red"
              )}
            >
              <AppIcon name={item.icon || kind.icon} className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {lang === "bn" ? kind.bn : kind.en}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                {L(item.title)}
              </h1>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {L(item.description)}
          </p>

          {/* meta rows */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {item.deadline && (
              <div className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("ev_deadline")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{fmtDate(item.deadline, lang)}</p>
                </div>
              </div>
            )}
            {item.event_date && (
              <div className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3.5">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("ev_date")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{fmtDate(item.event_date, lang)}</p>
                </div>
              </div>
            )}
            {item.location && (
              <div className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("ev_location")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{item.location}</p>
                </div>
              </div>
            )}
            {item.map_link && (
              <a
                href={item.map_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3.5 transition-colors hover:bg-brand-red-soft"
              >
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Map
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-red underline-offset-2 hover:underline">
                    {lang === "bn" ? "ম্যাপ লিংক খুলুন" : "Open map link"}
                  </p>
                </div>
              </a>
            )}
          </div>

          {/* status banners */}
          {cancelled && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-red-soft p-4 ring-1 ring-brand-red/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <div>
                <p className="text-sm font-bold text-brand-red-dark">{t("ev_cancelled")}</p>
                <p className="mt-0.5 text-sm text-brand-red-dark/80">
                  {lang === "bn"
                    ? "এই আইটেমটি বাতিল করা হয়েছে — পেমেন্ট চালু নেই।"
                    : "This item has been cancelled — payment is disabled."}
                </p>
              </div>
            </div>
          )}
          {postponed && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">{t("ev_postponed")}</p>
                {item.postpone_note && (
                  <p className="mt-0.5 text-sm text-amber-700">{L(item.postpone_note)}</p>
                )}
              </div>
            </div>
          )}
        </motion.section>

        {/* ================= right: payment card ================= */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm">
            <div className="brand-gradient h-1.5 w-full" />
            <div className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("ev_amount")}
              </p>

              {free ? (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-brand-green-soft px-3 py-1.5 text-sm font-bold text-brand-green">
                    {t("ev_free")}
                  </span>
                </div>
              ) : (
                <p className="mt-1 flex items-baseline gap-1 text-5xl font-extrabold tracking-tight text-brand-red">
                  <span className="text-2xl">৳</span>
                  <AnimatedAmount value={item.amount} />
                </p>
              )}

              {/* what you pay for */}
              <div className="mt-5 rounded-xl bg-black/[0.03] p-3.5 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {lang === "bn" ? "যা পরিশোধ করছেন" : "What you pay for"}
                </p>
                <p className="mt-1 font-semibold">{L(item.title)}</p>
              </div>

              {/* ---- paid state ---- */}
              {myPaid ? (
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-5 rounded-2xl bg-brand-green-soft p-4 ring-1 ring-brand-green/20"
                >
                  <div className="flex items-center gap-2 text-brand-green">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-bold">{t("ev_done")}</p>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-brand-green-dark">
                    {t("pay_txn")}: {myPaid.gateway_trxid ?? myPaid.tran_id}
                  </p>
                  {myPaid.gateway_trxid ? (
                    <p className="mt-1 break-all font-mono text-[11px] text-brand-green-dark/70">
                      {t("pay_reference")}: {myPaid.tran_id}
                    </p>
                  ) : null}
                </motion.div>
              ) : !user ? (
                /* ---- login required ---- */
                <div className="mt-5">
                  <div className="flex items-start gap-3 rounded-xl bg-brand-red-soft p-4">
                    <LogIn className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                    <p className="text-sm leading-relaxed text-brand-red-dark">
                      {lang === "bn"
                        ? "পেমেন্ট করতে সদস্য লগইন প্রয়োজন।"
                        : "Login as a member to continue payment."}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="mt-3 h-11 w-full rounded-xl brand-gradient font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Link href="/login">
                      <LogIn className="h-4 w-4" />
                      {t("nav_login")}
                    </Link>
                  </Button>
                </div>
              ) : (
                /* ---- pay button ---- */
                <Button
                  onClick={startPayment}
                  disabled={loading || cancelled || postponed}
                  className="mt-5 h-12 w-full rounded-xl brand-gradient text-base font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {lang === "bn" ? "অপেক্ষা করুন..." : "Please wait..."}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      {t("pay_continue")}
                    </>
                  )}
                </Button>
              )}

              {/* secure note */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-black/[0.03] p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {lang === "bn"
                    ? "রেড ক্রিসেন্ট গেটওয়ের মাধ্যমে সুরক্ষিত পেমেন্ট।"
                    : "Secure payment via the Red Crescent gateway."}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
