"use client";

// ============================================================
// Login Page — Member / Admin tabs,
// error mapping & instant session hydration
// ============================================================

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogoBadge } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { useEmergency } from "@/components/providers/emergency-popup";
import { fadeUp, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Role, SessionUser } from "@/lib/types";

/** API error → friendly bilingual message */
const ERRORS: Record<string, { en: string; bn: string }> = {
  invalid_credentials: { en: "Wrong ID or password", bn: "ভুল আইডি বা পাসওয়ার্ড" },
  not_admin: { en: "This is not an admin account", bn: "এটি কোনো অ্যাডমিন একাউন্ট নয়" },
  suspended: {
    en: "Your account has been suspended",
    bn: "আপনার একাউন্ট সাময়িকভাবে বন্ধ করা হয়েছে",
  },
  missing_credentials: { en: "Please fill in both fields", bn: "দুটি ঘরই পূরণ করুন" },
};

export function LoginPage() {
  const { t, lang } = useI18n();
  const { user, setUser, refresh: refreshAuth } = useAuth();
  const { refresh } = useEmergency();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search?.get("next");

  const [role, setRole] = useState<Role>("member");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const M = (bn: string, en: string) => (lang === "bn" ? bn : en);

  /* wait for the auth refresh to resolve (same pattern as admin layout) */
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

  /* already logged in → no login form, go home */
  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password) {
      toast.error(M("দুটি ঘরই পূরণ করুন", "Please fill in both fields"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id: id.trim(), password, role }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: SessionUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        const err = data.error ? ERRORS[data.error] : undefined;
        toast.error(err ? (lang === "bn" ? err.bn : err.en) : t("error_generic"));
        return;
      }
      setUser(data.user);
      toast.success(
        lang === "bn"
          ? `স্বাগতম, ${data.user.full_name}!`
          : `Welcome back, ${data.user.full_name}!`
      );
      refresh();
      /* safe internal redirect (e.g. back to a /pay link after login) */
      if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        router.push(nextPath);
        return;
      }
      router.push(data.user.role === "admin" ? "/admin" : "/");
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-extrabold tracking-tight">{t("login_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("login_sub")}</p>
          <div className="mx-auto mt-3 h-1 w-14 rounded-full brand-gradient" />
        </motion.div>

        {/* member / admin tabs */}
        <motion.div variants={fadeUp} className="mt-6">
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="member" className="rounded-lg font-bold">
                {t("login_tab_member")}
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className={cn(
                  "rounded-lg font-bold",
                  role === "admin" && "data-[state=active]:text-brand-red"
                )}
              >
                {t("login_tab_admin")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <motion.div variants={fadeUp}>
            <label
              htmlFor="login-id"
              className="text-xs font-bold text-foreground"
            >
              {t("login_id")}
            </label>
            <div className="relative mt-1.5">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={lang === "bn" ? "ইমেইল / ফোন / ইউজারনেম" : "email / phone / username"}
                autoComplete="username"
                className="h-11 rounded-xl bg-white pl-10 ring-1 ring-black/5"
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <label
              htmlFor="login-password"
              className="text-xs font-bold text-foreground"
            >
              {t("login_password")}
            </label>
            <div className="relative mt-1.5">
              <KeyRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="login-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 rounded-xl bg-white pl-10 pr-10 ring-1 ring-black/5"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* forgot password */}
          <motion.div variants={fadeUp} className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-brand-red underline-offset-4 hover:underline"
            >
              {t("login_forgot")}
            </Link>
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
                <LogIn className="h-5 w-5" aria-hidden="true" />
              )}
              {t("login_btn")}
            </Button>
          </motion.div>
        </form>

        {/* signup link */}
        <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-muted-foreground">
          {t("login_no_account")}{" "}
          <Link
            href="/signup"
            className="font-bold text-brand-red underline-offset-4 hover:underline"
          >
            {t("login_signup")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
