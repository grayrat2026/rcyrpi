"use client";

// ============================================================
// Page Builder — drag & drop home section ordering (@dnd-kit),
// visibility eye toggles, sticky save bar when dirty
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Lightbulb, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { HomeSectionCfg, LText, SectionKey } from "@/lib/types";

/* ---------------- section display names ---------------- */
const SECTION_NAMES: Record<SectionKey, LText> = {
  hero: { en: "Hero banner", bn: "Hero ব্যানার" },
  stats: { en: "Statistics", bn: "পরিসংখ্যান" },
  emergency_strip: { en: "Emergency board", bn: "ইমার্জেন্সি বোর্ড" },
  activities: { en: "Activities", bn: "কার্যক্রম" },
  events: { en: "Events", bn: "ইভেন্ট" },
  principles: { en: "7 Fundamental Principles", bn: "৭ মূলনীতি" },
  schedule: { en: "Weekly routine", bn: "সাপ্তাহিক রুটিন" },
  about: { en: "About us", bn: "আমাদের সম্পর্কে" },
  join_cta: { en: "Join CTA", bn: "যোগ দিন CTA" },
};

const T_HELPER: LText = {
  en: "Hold the handle on the left of a row and drag it up or down to change the home page order. Tap the eye to show or hide a section. Save — changes go live instantly on the home page.",
  bn: "কোনো সারির বাম দিকের হ্যান্ডেল ধরে উপর-নিচ টেনে হোম পেজের ক্রম বদলান। চোখের আইকনে চাপ দিয়ে সেকশন দেখাতে বা লুকাতে পারবেন। সেভ করলে সাথে সাথেই হোম পেজে পরিবর্তন লাইভ হয়ে যাবে।",
};
const T_SAVE: LText = { en: "Save changes", bn: "পরিবর্তন সংরক্ষণ" };
const T_SAVED: LText = { en: "Home page updated — live now", bn: "হোম পেজ আপডেট হয়েছে — এখনই লাইভ" };
const T_RESET: LText = { en: "Reset", bn: "রিসেট" };
const T_UNSAVED: LText = {
  en: "You have unsaved changes",
  bn: "সংরক্ষণ না করা পরিবর্তন আছে",
};

/* ---------------- sortable row ---------------- */
function SortableRow({
  cfg,
  onToggle,
  nameText,
}: {
  cfg: HomeSectionCfg;
  onToggle: () => void;
  nameText: string;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cfg.key, disabled: false });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex touch-manipulation items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5",
        isDragging && "z-20 scale-[1.015] shadow-lg ring-2 ring-brand-red/30",
        !cfg.visible && "opacity-55"
      )}
    >
      {/* grip handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${nameText}`}
        className="cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* name */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-semibold", !cfg.visible && "line-through decoration-border")}>
          {nameText}
        </p>
        <p className="text-xs text-muted-foreground">
          {cfg.visible ? t("adm_visible") : t("adm_hidden")}
        </p>
      </div>

      {/* eye toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-label={cfg.visible ? t("adm_hidden") : t("adm_visible")}
        aria-pressed={cfg.visible}
        className={cn(
          "h-9 w-9 shrink-0 rounded-full",
          cfg.visible ? "text-brand-green hover:bg-brand-green-soft" : "text-muted-foreground hover:bg-muted"
        )}
      >
        {cfg.visible ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
      </Button>
    </div>
  );
}

/* ---------------- main editor ---------------- */
export function ContentEditor() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  const [serverSections, setServerSections] = useState<HomeSectionCfg[] | null>(null);
  const [local, setLocal] = useState<HomeSectionCfg[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      const data = await res.json();
      const sections: HomeSectionCfg[] = data.sections ?? [];
      setServerSections(sections);
      setLocal(sections);
    } catch {
      toast.error(t("error_generic"));
      setServerSections([]);
      setLocal([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () =>
      serverSections !== null &&
      JSON.stringify(local) !== JSON.stringify(serverSections),
    [serverSections, local]
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setLocal((prev) => {
      const from = prev.findIndex((x) => x.key === active.id);
      const to = prev.findIndex((x) => x.key === over.id);
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  };

  const toggleVisible = (key: SectionKey) =>
    setLocal((prev) =>
      prev.map((x) => (x.key === key ? { ...x, visible: !x.visible } : x))
    );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: local }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sections: HomeSectionCfg[] = data.sections ?? local;
      setServerSections(sections);
      setLocal(sections);
      toast.success(s(T_SAVED));
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (serverSections) setLocal(serverSections);
  };

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("adm_content")}</h2>
        <p className="text-sm text-muted-foreground">{t("adm_content_sub")}</p>
      </div>

      {/* beginner helper card */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-green/25 bg-brand-green-soft/60 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-brand-green-dark sm:text-sm">{s(T_HELPER)}</p>
      </div>

      {/* sortable list */}
      {serverSections === null ? (
        <div className="space-y-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={local.map((x) => x.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {local.map((cfg) => (
                <SortableRow
                  key={cfg.key}
                  cfg={cfg}
                  onToggle={() => toggleVisible(cfg.key)}
                  nameText={L(SECTION_NAMES[cfg.key])}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* sticky save bar */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-lg ring-1 ring-black/10 sm:w-auto"
          >
            <p className="flex-1 text-sm font-semibold text-foreground">{s(T_UNSAVED)}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="rounded-full bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {s(T_RESET)}
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="rounded-full brand-gradient font-bold"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {t("adm_save")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
