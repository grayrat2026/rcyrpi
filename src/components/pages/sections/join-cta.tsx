"use client";

// ============================================================
// Home — Join CTA (red gradient band)
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CrescentBackground, Reveal } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { useAuth } from "@/store/auth-store";
import { hoverGrow } from "@/lib/motion";

export function JoinCta() {
  const { t } = useI18n();
  const tier = useDeviceTier();
  const { user } = useAuth();

  return (
    <section className="brand-gradient relative overflow-hidden">
      <CrescentBackground />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-14 text-center sm:py-18">
        <Reveal>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <AppIcon name="HandHeart" className="h-7 w-7 text-white" strokeWidth={2} />
          </span>
        </Reveal>

        <Reveal index={1}>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {t("join_title")}
          </h2>
        </Reveal>

        <Reveal index={2}>
          <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t("join_sub")}
          </p>
        </Reveal>

        <Reveal index={3}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <motion.div {...(tier !== "low" ? hoverGrow : {})}>
              <Button
                asChild
                size="lg"
                className="h-11 rounded-full bg-white px-8 text-sm font-bold text-brand-red shadow-lg shadow-black/10 hover:bg-white/90"
              >
                {user ? (
                  <Link href="/profile">
                    {t("nav_profile")}
                    <AppIcon name="UserRound" className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link href="/signup">
                    {t("join_btn")}
                    <AppIcon name="ArrowRight" className="h-4 w-4" />
                  </Link>
                )}
              </Button>
            </motion.div>

            {!user && (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-11 rounded-full px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">{t("login_title")}</Link>
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
