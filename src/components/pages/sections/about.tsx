"use client";

// ============================================================
// Home — About (2-col: text + decorative brand-gradient card)
// ============================================================

import { motion } from "framer-motion";
import { Reveal } from "@/components/shared/core";
import { CrescentIcon, SectionHeading } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { cn } from "@/lib/utils";

export function About() {
  const { t, lang } = useI18n();
  const tier = useDeviceTier();

  const chips = [
    lang === "bn" ? "১২০+ সদস্য" : "120+ Members",
    lang === "bn" ? "৪৫+ ইভেন্ট" : "45+ Events",
    lang === "bn" ? "প্রাথমিক চিকিৎসা" : "First Aid",
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
        {/* left — text */}
        <div>
          <SectionHeading align="left" title={t("about_title")} />
          <Reveal index={1}>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("about_body1")}
            </p>
          </Reveal>
          <Reveal index={2}>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("about_body2")}
            </p>
          </Reveal>
          <Reveal index={3}>
            <a
              href="https://bdrcs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-green-soft px-4 py-2 text-sm font-semibold text-brand-green-dark ring-1 ring-brand-green/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <AppIcon name="Link2" className="h-4 w-4" />
              {t("about_learn")}
              <AppIcon name="ArrowRight" className="h-3.5 w-3.5" />
            </a>
          </Reveal>
        </div>

        {/* right — decorative card */}
        <Reveal index={2}>
          <motion.div
            className={cn(tier !== "low" && "animate-float-slow")}
            whileHover={tier !== "low" ? { scale: 1.015 } : undefined}
            transition={{ duration: 0.3 }}
          >
            <div className="brand-gradient relative overflow-hidden rounded-3xl p-8 text-center text-white shadow-xl shadow-brand-red/20 sm:p-10">
              {/* decorative rings */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full border-[10px] border-white/10"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-[14px] border-white/10"
              />

              <CrescentIcon
                animated={tier !== "low"}
                className="mx-auto h-24 w-24 text-white sm:h-28 sm:w-28"
              />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                {lang === "bn" ? "১৯৭৩ সাল থেকে" : "Since 1973"}
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">BDRCS</p>
              <p className="mt-1 text-xs font-medium text-white/80">
                {lang === "bn" ? "বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি" : "Bangladesh Red Crescent Society"}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
