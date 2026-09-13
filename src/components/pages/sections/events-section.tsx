"use client";

// ============================================================
// Home — Events & campaigns (mobile snap-scroll / md+ grid)
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, SectionHeading } from "@/components/shared/core";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useDeviceTier } from "@/hooks/use-device-tier";
import type { HomeSectionCfg, Item, ItemKind, LText, Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_META: Record<ItemKind, { icon: string; en: string; bn: string }> = {
  event: { icon: "CalendarDays", en: "Event", bn: "ইভেন্ট" },
  donation: { icon: "HandHeart", en: "Donation", bn: "ডোনেশন" },
  gift: { icon: "Gift", en: "Gift", bn: "গিফট" },
};

function fmtDate(iso: string | undefined, lang: Lang): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function MetaChip({
  icon,
  children,
  tone = "muted",
}: {
  icon: string;
  children: React.ReactNode;
  tone?: "muted" | "red" | "green";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs",
        tone === "muted" && "bg-black/[0.04] text-muted-foreground",
        tone === "red" && "bg-brand-red-soft text-brand-red",
        tone === "green" && "bg-brand-green-soft text-brand-green-dark"
      )}
    >
      <AppIcon name={icon} className="h-3 w-3 shrink-0" strokeWidth={2.4} />
      <span className="truncate">{children}</span>
    </span>
  );
}

function EventCard({ item, index }: { item: Item; index: number }) {
  const { t, L, lang } = useI18n();
  const kind = KIND_META[item.kind] ?? KIND_META.event;
  const dateStr = fmtDate(item.deadline ?? item.event_date, lang);
  const isPostponed = item.status === "postponed";
  const paid = item.payment_required && item.amount > 0;

  return (
    <Reveal index={index} className="min-w-[270px] snap-start md:min-w-0 sm:min-w-[300px]">
      <motion.article
        className={cn(
          "flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-lg",
          isPostponed && "ring-amber-300/60"
        )}
      >
        {/* top row */}
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red-soft text-brand-red">
            <AppIcon name={item.icon || kind.icon} className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <Badge
            variant="outline"
            className="rounded-full border-black/10 bg-black/[0.03] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <AppIcon name={kind.icon} className="h-3 w-3" />
            {lang === "bn" ? kind.bn : kind.en}
          </Badge>
          {isPostponed && (
            <Badge className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-black hover:bg-amber-400">
              {t("ev_postponed")}
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          {L(item.title)}
        </h3>

        {isPostponed && item.postpone_note && (
          <p className="mt-1.5 line-clamp-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
            {L(item.postpone_note)}
          </p>
        )}

        {/* meta chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dateStr && (
            <MetaChip icon="Calendar">
              {t("ev_deadline")}: {dateStr}
            </MetaChip>
          )}
          {item.location && (
            <MetaChip icon="MapPin">{item.location}</MetaChip>
          )}
          {paid ? (
            <MetaChip icon="Wallet" tone="red">
              {"\u09F3"}
              {item.amount.toLocaleString("en-US")}
            </MetaChip>
          ) : (
            <MetaChip icon="CheckCircle2" tone="green">
              {t("ev_free")}
            </MetaChip>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-1 md:mt-auto">
          <Button
            asChild
            size="sm"
            className="w-full rounded-full bg-brand-red text-xs font-semibold text-white shadow-sm hover:bg-brand-red-dark"
          >
            <Link href={`/payments/${item.id}`}>
              {t("ev_details")}
              <AppIcon name="ArrowRight" className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </motion.article>
    </Reveal>
  );
}

export function EventsSection({
  items,
  cfg,
}: {
  items: Item[];
  cfg?: HomeSectionCfg;
}) {
  const { t, L, lang } = useI18n();
  const title = cfg?.title ? L(cfg.title as LText) : t("ev_title");
  const subtitle = cfg?.subtitle ? L(cfg.subtitle as LText) : t("ev_sub");

  const shown = items
    .filter((i) => i.kind && (i.status === "active" || i.status === "postponed"))
    .slice(0, 6);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
      <SectionHeading title={title} subtitle={subtitle} />

      {shown.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <AppIcon name="CalendarOff" className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.8} />
          <p className="text-sm font-medium text-muted-foreground sm:text-base">
            {lang === "bn"
              ? "এখন কোনো সক্রিয় ইভেন্ট নেই — শীঘ্রই আসছে!"
              : "No active events right now — stay tuned!"}
          </p>
        </div>
      ) : (
        <div className="nice-scroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-2 md:snap-none md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {shown.map((it, i) => (
            <EventCard key={it.id} item={it} index={i} />
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <div className="mt-6 text-center">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-brand-green px-5 text-xs font-semibold text-brand-green-dark hover:bg-brand-green-soft hover:text-brand-green-dark"
          >
            <Link href="/payments">
              {lang === "bn" ? "সব দেখুন" : "View all"}
              <AppIcon name="ArrowRight" className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
