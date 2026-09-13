"use client";

// ============================================================
// Forgot Password Page — request a reset link by email.
// When SMTP is not configured the API returns a dev fallback
// reset_url which is surfaced in a highlighted box.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoBadge } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { fadeUp, staggerParent } from "@/lib/motion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { t, lang } = useI18n();
  const { user, refresh: refreshAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /* wait for the auth refresh to resolve (same pattern as login) */
  useEffect(() => {
    let alive = true;
    refreshAuth().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // run once on mount — refresh identity changes every render (zustand hook)
  }, []);

  /* already logged in → no form, go home */
  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast.error(t("fp_invalid_email"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: value, lang }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reset_url?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(
          data.error === "invalid_email" ? t("fp_invalid_email") : t("error_generic")
        );
        return;
      }
      setResetUrl(data.reset_url ?? null);
      setSent(true);
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSending(false);
    }
  };

  /* auth still resolving / already logged in → no form flash */
  if (!ready || user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden="true" />
        <span className="sr-only">{t("loading")}</span>
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
          <h1 className="text-2xl font-extrabold tracking-tight">{t("fp_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fp_sub")}</p>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full brand-gradient" />
        </motion.div>

        {!sent ? (
          /* request form */
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <motion.div variants={fadeUp}>
              <label htmlFor="fp-email" className="text-xs font-bold text-foreground">
                {t("fp_email")}
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 rounded-xl bg-white pl-10 ring-1 ring-black/5"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                type="submit"
                disabled={sending}
                className="h-11 w-full rounded-xl brand-gradient text-base font-bold text-white hover:opacity-95"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-5 w-5" aria-hidden="true" />
                )}
                {sending ? t("fp_sending") : t("fp_send")}
              </Button>
            </motion.div>
          </form>
        ) : (
          /* sent confirmation */
          <motion.div variants={fadeUp} className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-soft">
              <MailCheck className="h-7 w-7 text-brand-green" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-lg font-extrabold">{t("fp_sent_title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("fp_sent_body")}</p>

            {/* dev fallback — SMTP not configured → direct reset link */}
            {resetUrl && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-left ring-1 ring-amber-200">
                <p className="text-xs font-semibold leading-relaxed text-amber-900">
                  {t("fp_fallback_note")}
                </p>
                <a
                  href={resetUrl}
                  className="mt-2 block break-all font-mono text-xs text-brand-red underline-offset-4 hover:underline"
                >
                  {resetUrl}
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* back to login */}
        <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-bold text-brand-red underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("fp_back")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
