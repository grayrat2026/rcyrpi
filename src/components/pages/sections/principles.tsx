"use client";

// ============================================================
// Home — The 7 Fundamental Principles (ghost-number cards)
// ============================================================

import { Reveal, RevealGroup, SectionHeading } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { PRINCIPLES } from "@/data/static";
import type { HomeSectionCfg, LText } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Principles({ cfg }: { cfg?: HomeSectionCfg }) {
  const { t, L } = useI18n();
  const title = cfg?.title ? L(cfg.title as LText) : t("pr_title");
  const subtitle = cfg?.subtitle ? L(cfg.subtitle as LText) : t("pr_sub");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <SectionHeading title={title} subtitle={subtitle} />

      <RevealGroup className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {PRINCIPLES.map((p, i) => {
          const last = i === PRINCIPLES.length - 1;
          return (
            <Reveal
              key={p.title.en}
              index={i}
              className={cn(
                last && "col-span-2 md:col-span-1 md:col-start-2 lg:col-span-2 lg:col-start-2"
              )}
            >
              <div className="group relative h-full overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-brand-red sm:p-6">
                {/* ghost number */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-2 select-none text-5xl font-black text-black/[0.05] sm:text-6xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="relative mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-red-soft text-brand-red transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse">
                  <AppIcon name={p.icon} className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <h3 className="relative text-sm font-bold sm:text-base">{L(p.title)}</h3>
                <p className="relative mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {L(p.desc)}
                </p>
              </div>
            </Reveal>
          );
        })}
      </RevealGroup>
    </section>
  );
}
