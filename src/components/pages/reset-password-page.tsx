"use client";

// ============================================================
// Reset Password Page — consumes the emailed token and sets a
// new password. useSearchParams requires a Suspense boundary,
// so the exported page wraps the inner client component.
// ============================================================

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoBadge } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { fadeUp, staggerParent } from "@/lib/motion";

function ResetPasswordInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const M = (bn: string, en: string) => (lang === "bn" ? bn : en);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiInvalid, setApiInvalid] = useState(false);

  /* no token in URL, or API rejected it → alert card */
  const invalid = !token || apiInvalid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      toast.error(t("prof_pw_short"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("prof_pw_mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        if (data.error === "invalid_token") setApiInvalid(true);
        else if (data.error === "pw_short") toast.error(t("prof_pw_short"));
        else toast.error(t("error_generic"));
        return;
      }
      setDone(true);
      toast.success(t("rp_updated"));
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    /* invalid / missing token alert card */
    return (
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md flex-col justify-center px-4 py-10">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-white p-6 text-center shadow-xl shadow-brand-red/5 ring-1 ring-black/5 sm:p-8"
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-soft"
          >
            <AlertCircle className="h-7 w-7 text-brand-red" aria-hidden="true" />
          </motion.div>
          <motion.p
            variants={fadeUp}
            className="mt-3 text-sm font-semibold leading-relaxed text-foreground"
          >
            {t("rp_invalid")}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-5">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-red underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("fp_back")}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md flex-col justify-center px-4 py-10">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="show"
        className="rounded-2xl bg-white p-6 shadow-xl shadow-brand-red/5 ring-1 ring-black/5 sm:p-8"
      >
        {/* two logos */}
        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
          <LogoBadge src="/logos/bdrcs.png" alt="Bangladesh Red Crescent Society" size={44} />
          <span className="h-8 w-px bg-border" aria-hidden="true" />
          <LogoBadge src="/logos/rgpi.png" alt="Rangpur Govt. Polytechnic Institute" size={44} />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-4 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">{t("rp_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("rp_sub")}</p>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full brand-gradient" />
        </motion.div>

        {done ? (
          /* success — redirecting to login */
          <motion.div variants={fadeUp} className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-soft">
              <ShieldCheck className="h-7 w-7 text-brand-green" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{t("rp_updated")}</p>
          </motion.div>
        ) : (
          /* new password form */
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <motion.div variants={fadeUp}>
              <label htmlFor="rp-password" className="text-xs font-bold text-foreground">
                {t("rp_new_pw")}
              </label>
              <div className="relative mt-1.5">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="rp-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 rounded-xl bg-white pl-10 pr-10 ring-1 ring-black/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? M("পাসওয়ার্ড লুকান", "Hide password") : M("পাসওয়ার্ড দেখান", "Show password")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <label htmlFor="rp-confirm" className="text-xs font-bold text-foreground">
                {t("rp_confirm_pw")}
              </label>
              <div className="relative mt-1.5">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="rp-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 rounded-xl bg-white pl-10 pr-10 ring-1 ring-black/5"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={
                    showConfirm ? M("পাসওয়ার্ড লুকান", "Hide password") : M("পাসওয়ার্ড দেখান", "Show password")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl brand-gradient text-base font-bold text-white hover:opacity-95"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                )}
                {loading ? t("rp_updating") : t("rp_update")}
              </Button>
            </motion.div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
