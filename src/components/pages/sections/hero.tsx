"use client";

// ============================================================
// Home — Hero section (centered, dual logos, animated)
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CrescentBackground,
  LogoBadge,
  Reveal,
  RevealGroup,
} from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { useAuth } from "@/store/auth-store";
import { hoverGrow } from "@/lib/motion";

function Chip({
  icon,
  label,
  className = "",
  delay = "0s",
  floating,
}: {
  icon: string;
  label: string;
  className?: string;
  delay?: string;
  floating?: boolean;
}) {
  const tier = useDeviceTier();
  const cls = floating && tier !== "low" ? "animate-float" : "";
  return (
    <span
      style={floating ? { animationDelay: delay } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur ${cls} ${className}`}
    >
      <AppIcon
        name={icon}
        className="h-3.5 w-3.5 text-brand-red"
        strokeWidth={2.2}
      />
      {label}
    </span>
  );
}

export function Hero() {
  const { t, lang } = useI18n();
  const tier = useDeviceTier();
  const { user } = useAuth();

  const chips = [
    { icon: "Scale", label: lang === "bn" ? "৭টি মূলনীতি" : "7 Principles" },
    { icon: "Droplets", label: lang === "bn" ? "২৪/৭ রক্তের পুল" : "24/7 Blood Pool" },
    { icon: "Heart", label: lang === "bn" ? "১৯৭৩ সাল থেকে" : "Since 1973" },
  ];

  return (
    <section className="relative overflow-hidden">
      <CrescentBackground />
      {/* soft brand wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-brand-red-soft [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 pb-16 pt-12 text-center sm:pb-20 sm:pt-20">
        <RevealGroup className="flex flex-col items-center gap-5">
          {/* badge chip */}
          <Reveal index={0}>
            <Badge className="rounded-full border-transparent bg-brand-green-soft px-4 py-1.5 text-xs font-semibold text-brand-green-dark hover:bg-brand-green-soft">
              <AppIcon name="ShieldCheck" className="h-3.5 w-3.5" />
              {t("hero_badge")}
            </Badge>
          </Reveal>

          {/* logos (mobile row — above title) */}
          <Reveal index={1} className="flex items-center gap-4 md:hidden">
            <LogoBadge src="/logos/bdrcs.png" alt="Bangladesh Red Crescent Society" size={56} priority />
            <LogoBadge src="/logos/rgpi.png" alt="Rangpur Govt. Polytechnic Institute" size={56} priority />
          </Reveal>

          {/* title with flanking logos on md+ */}
          <Reveal index={2}>
            <div className="flex items-center justify-center gap-5 sm:gap-8">
              <LogoBadge
                src="/logos/bdrcs.png"
                alt="Bangladesh Red Crescent Society"
                size={72}
                priority
                className="hidden md:inline-flex"
              />
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {t("hero_title_1")}
                <br />
                <span className="text-brand-gradient">{t("hero_title_2")}</span>
              </h1>
              <LogoBadge
                src="/logos/rgpi.png"
                alt="Rangpur Govt. Polytechnic Institute"
                size={72}
                priority
                className="hidden md:inline-flex"
              />
            </div>
          </Reveal>

          <Reveal index={3}>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("hero_desc")}
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal index={4}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div {...(tier !== "low" ? hoverGrow : {})}>
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full bg-brand-red px-7 text-sm font-semibold text-white shadow-md shadow-brand-red/25 hover:bg-brand-red-dark"
                >
                  <Link href="/request">
                    <AppIcon name="Siren" className="h-4 w-4" />
                    {t("hero_cta_blood")}
                  </Link>
                </Button>
              </motion.div>
              {!user && (
                <motion.div {...(tier !== "low" ? hoverGrow : {})}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-11 rounded-full border-brand-green bg-white px-7 text-sm font-semibold text-brand-green-dark shadow-sm hover:bg-brand-green-soft hover:text-brand-green-dark"
                  >
                    <Link href="/signup">
                      <AppIcon name="HandHeart" className="h-4 w-4" />
                      {t("hero_cta_join")}
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </Reveal>

          {/* chips — static row on mobile / tablet */}
          <Reveal index={5} className="flex flex-wrap items-center justify-center gap-2 lg:hidden">
            {chips.map((c) => (
              <Chip key={c.label} icon={c.icon} label={c.label} />
            ))}
          </Reveal>
        </RevealGroup>

        {/* floating chips — desktop only, decorative */}
        {tier !== "low" && (
          <>
            <div className="pointer-events-none absolute left-[7%] top-[26%] hidden lg:block">
              <Chip icon={chips[0].icon} label={chips[0].label} floating />
            </div>
            <div className="pointer-events-none absolute right-[6%] top-[38%] hidden lg:block">
              <Chip icon={chips[1].icon} label={chips[1].label} floating delay="1.4s" />
            </div>
            <div className="pointer-events-none absolute bottom-[16%] left-[11%] hidden lg:block">
              <Chip icon={chips[2].icon} label={chips[2].label} floating delay="2.6s" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
