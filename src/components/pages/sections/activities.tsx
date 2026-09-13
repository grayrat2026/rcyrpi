"use client";

// ============================================================
// Home — Activities grid (8 cards, icon micro-interactions)
// ============================================================

import { motion } from "framer-motion";
import { Reveal, RevealGroup } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { SectionHeading } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { ACTIVITIES } from "@/data/static";
import type { HomeSectionCfg, LText } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Activities({ cfg }: { cfg?: HomeSectionCfg }) {
  const { t, L } = useI18n();
  const tier = useDeviceTier();
  const title = cfg?.title ? L(cfg.title as LText) : t("act_title");
  const subtitle = cfg?.subtitle ? L(cfg.subtitle as LText) : t("act_sub");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <SectionHeading title={title} subtitle={subtitle} />

      <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIVITIES.map((a, i) => (
          <Reveal key={a.id} index={i}>
            <motion.div
              className={cn(
                "group h-full rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-lg sm:p-6",
                tier !== "low" && "hover:-translate-y-1 transition-transform"
              )}
              whileHover={tier !== "low" ? { y: -4 } : undefined}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className={cn(
                  "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full",
                  a.color === "red"
                    ? "bg-brand-red-soft text-brand-red"
                    : "bg-brand-green-soft text-brand-green-dark"
                )}
                whileHover={tier !== "low" ? { scale: 1.15, rotate: -8 } : undefined}
                transition={{ type: "spring", stiffness: 320, damping: 14 }}
              >
                <AppIcon name={a.icon} className="h-6 w-6" strokeWidth={2.1} />
              </motion.span>
              <h3 className="text-sm font-bold sm:text-base">{L(a.title)}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {L(a.desc)}
              </p>
            </motion.div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
