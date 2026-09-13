"use client";

// ============================================================
// Home — Emergency notice strip (live alerts)
// ============================================================

import { motion } from "framer-motion";
import { Reveal, SectionHeading, SeverityBadge } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { hoverLift } from "@/lib/motion";
import type { FeedAlert, HomeSectionCfg, LText } from "@/lib/types";

/** auto source -> lucide icon name */
function sourceIcon(source: FeedAlert["source"]): string {
  switch (source) {
    case "auto:earthquake":
      return "Activity";
    case "auto:flood":
      return "Waves";
    case "request":
      return "Ambulance";
    default:
      return "Megaphone";
  }
}

function AlertCard({ alert, index }: { alert: FeedAlert; index: number }) {
  const { L } = useI18n();
  const tier = useDeviceTier();
  const href = alert.link || "/notices";

  return (
    <Reveal index={index}>
      <motion.a
        href={href}
        {...(tier !== "low" ? hoverLift : {})}
        className="group block rounded-2xl border-r-4 border-r-brand-red bg-white p-4 shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-lg sm:p-5"
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-brand-red transition-transform duration-300 group-hover:scale-110">
            <AppIcon name={sourceIcon(alert.source)} className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="animate-blink truncate text-sm font-bold text-brand-red sm:text-base">
              {L(alert.title)}
            </h3>
          </div>
          <SeverityBadge severity={alert.severity} />
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {L(alert.body)}
        </p>
      </motion.a>
    </Reveal>
  );
}

export function EmergencyStrip({
  alerts,
  cfg,
}: {
  alerts: FeedAlert[];
  cfg?: HomeSectionCfg;
}) {
  const { t, L } = useI18n();
  const title = cfg?.title ? L(cfg.title as LText) : t("strip_title");
  const subtitle = cfg?.subtitle ? L(cfg.subtitle as LText) : t("strip_sub");
  const shown = alerts.slice(0, 4);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <SectionHeading danger title={title} subtitle={subtitle} />

      {shown.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl bg-brand-green-soft p-8 text-center ring-1 ring-brand-green/10">
          <AppIcon name="CheckCircle2" className="h-10 w-10 text-brand-green-dark" strokeWidth={2} />
          <p className="text-sm font-medium text-brand-green-dark sm:text-base">
            {t("strip_empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shown.map((a, i) => (
            <AlertCard key={a.id} alert={a} index={i} />
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <a
          href="/notices"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red underline-offset-4 transition-colors hover:text-brand-red-dark hover:underline"
        >
          {t("strip_view_all")}
          <AppIcon name="ArrowRight" className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
