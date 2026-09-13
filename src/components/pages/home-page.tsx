"use client";

// ============================================================
// Home page — fetches content config + items + emergency feed
// in parallel, then renders admin-ordered sections.
// ============================================================

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import type { FeedAlert, HomeSectionCfg, Item, SectionKey } from "@/lib/types";
import { Hero } from "./sections/hero";
import { Stats } from "./sections/stats";
import { EmergencyStrip } from "./sections/emergency-strip";
import { Activities } from "./sections/activities";
import { EventsSection } from "./sections/events-section";
import { Schedule } from "./sections/schedule";
import { Principles } from "./sections/principles";
import { About } from "./sections/about";
import { JoinCta } from "./sections/join-cta";

const SECTION_KEYS: SectionKey[] = [
  "hero",
  "stats",
  "emergency_strip",
  "activities",
  "events",
  "schedule",
  "principles",
  "about",
  "join_cta",
];

/** fallback order when /api/content is unavailable */
const DEFAULT_SECTIONS: HomeSectionCfg[] = SECTION_KEYS.map((key) => ({ key, visible: true }));

function HomeSkeleton() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>

      {/* hero */}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 pb-16 pt-14">
        <Skeleton className="h-7 w-72 max-w-full rounded-full" />
        <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-12 w-2/3 max-w-md rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg rounded-full" />
        <div className="mt-2 flex gap-3">
          <Skeleton className="h-11 w-44 rounded-full" />
          <Skeleton className="h-11 w-44 rounded-full" />
        </div>
      </div>

      {/* stats */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 px-4 pb-14 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl sm:h-36" />
        ))}
      </div>

      {/* emergency strip */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-14">
        <Skeleton className="mx-auto mb-8 h-8 w-72 max-w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* cards grid */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <Skeleton className="mx-auto mb-8 h-8 w-64 max-w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const [sections, setSections] = useState<HomeSectionCfg[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [alerts, setAlerts] = useState<FeedAlert[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [contentRes, itemsRes, feedRes] = await Promise.all([
          fetch("/api/content"),
          fetch("/api/items?kind=all"),
          fetch("/api/emergency/feed", { cache: "no-store" }),
        ]);

        const content = (await contentRes.json()) as { sections?: HomeSectionCfg[] };
        const itemData = (await itemsRes.json()) as { items?: Item[] };
        const feedData = (await feedRes.json()) as { alerts?: FeedAlert[] };

        if (!alive) return;
        setSections(
          Array.isArray(content.sections) && content.sections.length > 0
            ? content.sections
            : DEFAULT_SECTIONS
        );
        setItems(Array.isArray(itemData.items) ? itemData.items : []);
        setAlerts(Array.isArray(feedData.alerts) ? feedData.alerts : []);
      } catch {
        if (!alive) return;
        setSections(DEFAULT_SECTIONS);
        setItems([]);
        setAlerts([]);
        setFailed(true);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (sections === null) return <HomeSkeleton />;

  const visible = sections.filter(
    (s): s is HomeSectionCfg => SECTION_KEYS.includes(s.key) && s.visible
  );

  return (
    <div className="flex flex-col">
      {failed && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4">
          <p
            role="status"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-red-soft px-4 py-2.5 text-center text-xs font-medium text-brand-red-dark ring-1 ring-brand-red/10"
          >
            <AppIcon name="AlertTriangle" className="h-3.5 w-3.5 shrink-0" />
            Some live data could not be loaded — showing cached layout.
          </p>
        </div>
      )}

      {visible.map((cfg) => {
        switch (cfg.key) {
          case "hero":
            return <Hero key="hero" />;
          case "stats":
            return <Stats key="stats" />;
          case "emergency_strip":
            return <EmergencyStrip key="emergency_strip" alerts={alerts} cfg={cfg} />;
          case "activities":
            return <Activities key="activities" cfg={cfg} />;
          case "events":
            return <EventsSection key="events" items={items} cfg={cfg} />;
          case "schedule":
            return <Schedule key="schedule" cfg={cfg} />;
          case "principles":
            return <Principles key="principles" cfg={cfg} />;
          case "about":
            return <About key="about" />;
          case "join_cta":
            return <JoinCta key="join_cta" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
