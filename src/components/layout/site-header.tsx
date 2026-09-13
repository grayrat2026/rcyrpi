"use client";

// ============================================================
// Site header — LEFT: BDRCS logo • CENTER: title • RIGHT: controls
// Below: sticky nav + live emergency ticker (all pages)
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserRound } from "lucide-react";
import { AppIcon } from "@/components/shared/app-icon";
import { LogoBadge, BlinkDot } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n/dictionary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV: { href: string; key: DictKey; icon: string }[] = [
  { href: "/", key: "nav_home", icon: "Sparkles" },
  { href: "/notices", key: "nav_notices", icon: "Bell" },
  { href: "/payments", key: "nav_payments", icon: "CreditCard" },
  { href: "/request", key: "nav_request", icon: "Siren" },
];

export function SiteHeader() {
  const { t, lang, toggle } = useI18n();
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* main brand bar */}
      <div
        className={cn(
          "glass border-b transition-shadow duration-300",
          scrolled && "shadow-[0_8px_30px_rgba(227,6,19,0.08)]"
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:h-[72px] sm:px-4">
          {/* LEFT — Bangladesh Red Crescent Society logo */}
          <Link href="/" className="shrink-0" aria-label="BDRCS home">
            <LogoBadge src="/logos/bdrcs.png" alt="Bangladesh Red Crescent Society" size={46} priority />
          </Link>

          {/* CENTER — title */}
          <Link href="/" className="group min-w-0 flex-1 text-center sm:text-left">
            <motion.p
              className="truncate text-[15px] font-extrabold leading-tight tracking-tight sm:text-xl"
              whileHover={{ scale: 1.01 }}
            >
              <span className="text-brand-red">Youth</span>{" "}
              <span className="text-brand-red">Red Crescent</span>{" "}
              <span className="text-brand-green">Team</span>
            </motion.p>
            <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
              Rangpur Govt. Polytechnic Institute
            </p>
          </Link>

          {/* desktop nav */}
          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={pathname === item.href}
                className={cn(
                  "nav-link rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-foreground/80 transition-colors hover:text-brand-red",
                  pathname === item.href && "text-brand-red"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* right controls */}
          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            {/* language toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggle}
              className="h-8 gap-1 rounded-full px-2.5 text-xs font-bold"
              aria-label="Toggle language"
            >
              <AppIcon name="Globe2" className="h-3.5 w-3.5 text-brand-green" />
              {lang === "bn" ? "বাং" : "EN"}
            </Button>

            {/* auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-brand-red/20 transition hover:ring-brand-red/50" aria-label="Account menu">
                    <Avatar className="h-9 w-9">
                      {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.full_name} /> : null}
                      <AvatarFallback className="brand-gradient text-xs font-bold text-white">
                        {user.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-bold">{user.full_name}</p>
                    <p className="text-xs font-normal text-muted-foreground">@{user.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <AppIcon name="LayoutDashboard" className="mr-2 h-4 w-4 text-brand-red" />
                        {t("nav_admin")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserRound className="mr-2 h-4 w-4 text-brand-green" />
                      {t("prof_title")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payments">
                      <AppIcon name="CreditCard" className="mr-2 h-4 w-4 text-brand-green" />
                      {t("nav_payments")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <AppIcon name="LogOut" className="mr-2 h-4 w-4" />
                    {t("nav_logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                size="sm"
                className="hidden h-8 rounded-full brand-gradient px-4 text-xs font-bold shadow-sm hover:opacity-90 sm:inline-flex"
              >
                <Link href="/login">
                  <AppIcon name="LogIn" className="mr-1.5 h-3.5 w-3.5" />
                  {t("nav_login")}
                </Link>
              </Button>
            )}

            {/* mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" aria-label="Menu">
                  <AppIcon name="Menu" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="text-brand-red">{t("brand")}</SheetTitle>
                <div className="mt-2 flex flex-col gap-1">
                  {NAV.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-brand-red-soft hover:text-brand-red",
                          pathname === item.href && "bg-brand-red-soft text-brand-red"
                        )}
                      >
                        <AppIcon name={item.icon} className="h-4.5 w-4.5" />
                        {t(item.key)}
                      </Link>
                    </motion.div>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  {user ? (
                    <>
                      <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-brand-green-soft hover:text-brand-green-dark">
                        <UserRound className="h-4.5 w-4.5" />
                        {t("prof_title")}
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-brand-green-soft hover:text-brand-green-dark">
                          <AppIcon name="LayoutDashboard" className="h-4.5 w-4.5" />
                          {t("nav_admin")}
                        </Link>
                      )}
                      <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive hover:bg-red-50">
                        <AppIcon name="LogOut" className="h-4.5 w-4.5" />
                        {t("nav_logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-brand-red-soft">
                        <AppIcon name="LogIn" className="h-4.5 w-4.5" />
                        {t("nav_login")}
                      </Link>
                      <Link href="/signup" onClick={() => setOpen(false)} className="brand-gradient mt-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white">
                        <AppIcon name="HandHeart" className="h-4.5 w-4.5" />
                        {t("nav_join")}
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* live emergency ticker (present on every page) */}
      <EmergencyTicker />
    </header>
  );
}

function EmergencyTicker() {
  const { t, L } = useI18n();
  const [items, setItems] = useState<{ id: string; title: { en: string; bn: string } }[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notices", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setItems(
          (data.notices ?? [])
            .filter((n: { category: string; severity: string }) =>
              n.category === "emergency" || n.category === "blood" || n.severity === "high" || n.severity === "critical"
            )
            .slice(0, 6)
        );
      } catch { /* silent */ }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  if (!items.length) return null;

  return (
    <div className="marquee-paused overflow-hidden border-b border-red-200 bg-brand-red-soft" role="status" aria-label="Emergency ticker">
      <div className="flex items-stretch">
        <div className="brand-gradient z-10 flex shrink-0 items-center gap-1.5 px-3 text-[10px] font-extrabold tracking-widest text-white">
          <BlinkDot className="bg-white" />
          <span className="hidden sm:inline">{t("ticker_label")}</span>
          <span className="sm:hidden">LIVE</span>
        </div>
        <div className="relative flex-1 overflow-hidden py-1.5">
          <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
            {[...items, ...items].map((n, i) => (
              <Link key={`${n.id}-${i}`} href="/notices" className="flex items-center gap-2 text-xs font-semibold text-brand-red-dark hover:underline">
                <AppIcon name="AlertTriangle" className="h-3 w-3 shrink-0" />
                {L(n.title)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
