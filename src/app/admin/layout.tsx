"use client";

// ============================================================
// Admin shell — auth guard + sidebar (desktop) / tab bar (mobile)
// Guard: refresh() on mount → skeleton → friendly login card
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogIn,
  Phone,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { LText } from "@/lib/types";
import type { DictKey } from "@/i18n/dictionary";

const ADMIN_PANEL: LText = { en: "Admin Panel", bn: "অ্যাডমিন প্যানেল" };
const BACK_SITE: LText = { en: "Back to site", bn: "সাইটে ফিরুন" };
const GUARD_TITLE: LText = { en: "Admin login required", bn: "অ্যাডমিন লগইন প্রয়োজন" };
const GUARD_DESC: LText = {
  en: "This area is for unit administrators only. Please sign in with an admin account to manage events, payments, members and broadcasts.",
  bn: "এই অংশটি শুধু ইউনিট অ্যাডমিনদের জন্য। ইভেন্ট, পেমেন্ট, সদস্য ও ব্রডকাস্ট পরিচালনা করতে অ্যাডমিন একাউন্ট দিয়ে লগইন করুন।",
};
const GUARD_HINT: LText = {
  en: "Sign in with the Admin tab using your admin account (login by username, email or phone).",
  bn: "অ্যাডমিন ট্যাব বেছে নিয়ে আপনার অ্যাডমিন একাউন্ট দিয়ে লগইন করুন (ইউজারনেম, ইমেইল বা ফোন দিয়ে)।",
};

const NAV: { href: string; labelKey: DictKey; icon: typeof LayoutDashboard }[] = [
  { href: "/admin", labelKey: "adm_dashboard", icon: LayoutDashboard },
  { href: "/admin/events", labelKey: "adm_events", icon: ClipboardList },
  { href: "/admin/schedule", labelKey: "schm_title", icon: CalendarDays },
  { href: "/admin/payments", labelKey: "adm_payments", icon: CreditCard },
  { href: "/admin/members", labelKey: "adm_members", icon: Users },
  { href: "/admin/contacts", labelKey: "contact_title", icon: Phone },
  { href: "/admin/broadcast", labelKey: "adm_broadcast", icon: Radio },
  { href: "/admin/content", labelKey: "adm_content", icon: Sparkles },
];

function initials(name: string | undefined): string {
  if (!name) return "A";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const { user, isAdmin, refresh } = useAuth();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    refresh().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // run once on mount — refresh identity changes every render (zustand hook)
  }, []);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  /* ---------- loading skeleton ---------- */
  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-56 rounded-2xl" />
        <div className="mt-6 flex gap-6">
          <Skeleton className="hidden h-[420px] w-60 shrink-0 rounded-2xl lg:block" />
          <div className="grid grid-cols-1 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- not logged in / not admin ---------- */
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-soft">
            <Shield className="h-8 w-8 text-brand-red" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">{s(GUARD_TITLE)}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s(GUARD_DESC)}</p>
          <Button
            asChild
            size="lg"
            className="mt-6 h-12 w-full rounded-full brand-gradient text-base font-semibold shadow-sm"
          >
            <Link href="/login">
              <LogIn className="h-5 w-5" aria-hidden="true" />
              {t("nav_login")}
            </Link>
          </Button>
          <div className="mt-5 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-black/5">
            <p className="mb-1 flex items-center justify-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
              <span>{s(GUARD_TITLE)}</span>
            </p>
            <p>{s(GUARD_HINT)}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------- authorized shell ---------- */
  return (
    <div className="mx-auto flex w-full max-w-[1440px] items-start">
      {/* desktop sidebar */}
      <aside
        aria-label="Admin navigation"
        className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-60 shrink-0 flex-col gap-1 border-r border-border/70 bg-white/50 px-3 py-6 lg:flex"
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="flex flex-col gap-1"
        >
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <motion.div
                key={item.href}
                variants={{
                  hidden: { opacity: 0, x: -14 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
                }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "font-semibold text-brand-red-dark"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      transition={{ duration: 0.3, ease: EASE }}
                      className="absolute inset-0 rounded-xl bg-brand-red-soft ring-1 ring-brand-red/15"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={cn("relative z-10 h-4 w-4", active && "text-brand-red")}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">{t(item.labelKey)}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* signed-in admin mini card */}
        <div className="mt-auto rounded-2xl bg-muted/70 p-3 ring-1 ring-black/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
              {initials(user.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.full_name}</p>
              <p className="text-xs font-medium text-brand-red-dark">{t("login_tab_admin")}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* mobile horizontal tab bar */}
        <nav
          aria-label="Admin sections"
          className="sticky top-16 z-30 border-b border-border/70 bg-white/85 px-3 py-2 backdrop-blur sm:top-[72px] lg:hidden"
        >
          <div className="nice-scroll flex gap-1.5 overflow-x-auto pb-0.5">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-brand-red-soft font-semibold text-brand-red-dark ring-1 ring-brand-red/20"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="px-4 pb-20 pt-5 sm:px-6 lg:px-8">
          {/* header row */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                {s(ADMIN_PANEL)}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("brand")} — {t("brand_sub")}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full bg-white shadow-sm"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {s(BACK_SITE)}
              </Link>
            </Button>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
