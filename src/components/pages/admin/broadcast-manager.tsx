"use client";

// ============================================================
// Broadcast Manager — compose emergency popup (template chips,
// live preview) + active/inactive broadcast list
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Megaphone,
  Radio,
  RotateCcw,
  Siren,
  Waves,
  Wind,
  Loader2,
  AlertTriangle,
  Flame,
  Car,
  Building2,
  CloudSnow,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EASE, fadeUp, staggerParent } from "@/lib/motion";
import { TEMPLATES } from "@/data/templates";
import type { Broadcast, LText } from "@/lib/types";

/* ---------------- local bilingual strings ---------------- */
const T_TPL_HELP: LText = {
  en: "Tap an emergency template to prefill everything — then edit and send.",
  bn: "যেকোনো ইমার্জেন্সি টেমপ্লেটে চাপ দিলে সব লেখা এসে ভরে যাবে — এডিট করে পাঠান।",
};
const T_TITLE_HELP_EN: LText = {
  en: "Big bold headline of the popup (English).",
  bn: "পপআপের বড় শিরোনাম (English)।",
};
const T_TITLE_HELP_BN: LText = {
  en: "Big bold headline of the popup (Bangla).",
  bn: "পপআপের বড় শিরোনাম (বাংলা)।",
};
const T_BODY_HELP: LText = {
  en: "Every visitor will see this instantly as a protected popup (cancel button unlocks after 3 seconds).",
  bn: "সব ভিজিটরের স্ক্রিনে ৩ সেকেন্ড প্রোটেক্টেড পপআপ আকারে দেখাবে (৩ সেকেন্ড পর বন্ধ করা যাবে)।",
};
const T_SEV_HELP: LText = {
  en: "High = orange alert, Critical = red blinking alert.",
  bn: "High = কমলা সতর্কতা, Critical = লাল জরুরি সতর্কতা।",
};
const T_PREVIEW: LText = { en: "Live preview", bn: "লাইভ প্রিভিউ" };
const T_PREVIEW_SUB: LText = {
  en: "This is how the popup will look on visitors' screens",
  bn: "ভিজিটরের স্ক্রিনে পপআপটি দেখতে এমন হবে",
};
const T_NEED_TITLE: LText = {
  en: "Write the title in Bangla or English first.",
  bn: "আগে বাংলা বা English-এ শিরোনাম লিখুন।",
};
const T_NEED_BODY: LText = {
  en: "Write the message body in Bangla or English.",
  bn: "বার্তার বডি বাংলা বা English-এ লিখুন।",
};
const T_SENT: LText = {
  en: "Broadcast sent — popup is live on every visitor's screen",
  bn: "ব্রডকাস্ট পাঠানো হয়েছে — সব ভিজিটরের স্ক্রিনে পপআপ চালু",
};
const T_DEACTIVATE_Q: LText = {
  en: "Deactivate this broadcast?",
  bn: "ব্রডকাস্টটি নিষ্ক্রিয় করবেন?",
};
const T_DEACTIVATE_D: LText = {
  en: "The popup will disappear from all screens immediately.",
  bn: "পপআপটি সাথে সাথে সব স্ক্রিন থেকে চলে যাবে।",
};
const T_DEACTIVATED: LText = { en: "Broadcast deactivated", bn: "ব্রডকাস্ট নিষ্ক্রিয় হয়েছে" };
const T_REACTIVATED: LText = { en: "Broadcast is live again", bn: "ব্রডকাস্ট আবার চালু" };
const T_LIST_TITLE: LText = { en: "Broadcast history", bn: "ব্রডকাস্ট ইতিহাস" };
const T_INACTIVE: LText = { en: "Inactive", bn: "নিষ্ক্রিয়" };
const T_HIGH: LText = { en: "High", bn: "হাই" };
const T_CRITICAL: LText = { en: "Critical", bn: "ক্রিটিক্যাল" };
const T_SRC: Record<Broadcast["source"], LText> = {
  admin: { en: "Admin", bn: "অ্যাডমিন" },
  "auto:earthquake": { en: "Auto: Earthquake", bn: "অটো: ভূমিকম্প" },
  "auto:flood": { en: "Auto: Flood", bn: "অটো: বন্যা" },
  request: { en: "Request", bn: "রিকোয়েস্ট" },
};
const T_EMPTY: LText = {
  en: "No broadcasts yet — send your first emergency message above.",
  bn: "এখনো কোনো ব্রডকাস্ট নেই — উপর থেকে প্রথম জরুরি বার্তা পাঠান।",
};

/* templates carry emoji — strip to honor the no-emoji rule */
function stripEmoji(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const EM_TPL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Waves,
  Flame,
  Car,
  Wind,
  CloudSnow,
  Building2,
  AlertTriangle,
};

export function BroadcastManager() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  const [broadcasts, setBroadcasts] = useState<Broadcast[] | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyBn, setBodyBn] = useState("");
  const [severity, setSeverity] = useState<"high" | "critical">("high");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Broadcast | null>(null);

  const emTemplates = TEMPLATES.filter((tp) => tp.group === "emergency");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcasts", { cache: "no-store" });
      const data = await res.json();
      setBroadcasts(data.broadcasts ?? []);
    } catch {
      toast.error(t("error_generic"));
      setBroadcasts([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const applyTemplate = (tplId: string) => {
    const tpl = TEMPLATES.find((x) => x.id === tplId);
    if (!tpl) return;
    setTitleEn(stripEmoji(tpl.defaults.title.en));
    setTitleBn(stripEmoji(tpl.defaults.title.bn));
    setBodyEn(stripEmoji(tpl.defaults.body.en));
    setBodyBn(stripEmoji(tpl.defaults.body.bn));
    setSeverity(tpl.severity === "critical" ? "critical" : "high");
  };

  const resetForm = () => {
    setTitleEn("");
    setTitleBn("");
    setBodyEn("");
    setBodyBn("");
    setSeverity("high");
  };

  const send = async () => {
    if (!titleEn.trim() && !titleBn.trim()) {
      toast.error(s(T_NEED_TITLE));
      return;
    }
    if (!bodyEn.trim() && !bodyBn.trim()) {
      toast.error(s(T_NEED_BODY));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: { en: titleEn.trim(), bn: titleBn.trim() },
          body: { en: bodyEn.trim(), bn: bodyBn.trim() },
          severity,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(s(T_SENT));
      resetForm();
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSending(false);
    }
  };

  const patchActive = async (b: Broadcast, active: boolean) => {
    setBusyId(b.id);
    try {
      const res = await fetch(`/api/broadcasts/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
      toast.success(active ? s(T_REACTIVATED) : s(T_DEACTIVATED));
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const active = (broadcasts ?? []).filter((b) => b.active);
  const inactive = (broadcasts ?? []).filter((b) => !b.active);

  const sevChip = (b: Broadcast) =>
    b.severity === "critical" ? (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white animate-blink">
        <Siren className="h-3 w-3" aria-hidden="true" />
        {s(T_CRITICAL)}
      </span>
    ) : (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        {s(T_HIGH)}
      </span>
    );

  return (
    <div className="mx-auto max-w-6xl">
      {/* header */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
          <Radio className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            {t("adm_broadcast_title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("adm_broadcast_sub")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* compose card */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-3">
          {/* quick template chips */}
          <p className="text-sm font-semibold">{t("adm_templates")}</p>
          <div className="nice-scroll mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {emTemplates.map((tpl) => {
              const TplIcon = EM_TPL_ICON[tpl.icon] ?? Activity;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-brand-red-soft hover:text-brand-red-dark"
                >
                  <TplIcon className="h-3.5 w-3.5" />
                  {L(tpl.title)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s(T_TPL_HELP)}</p>

          <div className="mt-4 space-y-4">
            {/* titles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="bc-title-en" className="text-sm font-semibold">
                  {t("adm_title_en")}
                </Label>
                <Input
                  id="bc-title-en"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="mt-1 rounded-xl bg-white"
                  placeholder="FLOOD WARNING"
                />
                <p className="mt-1 text-xs text-muted-foreground">{s(T_TITLE_HELP_EN)}</p>
              </div>
              <div className="min-w-0">
                <Label htmlFor="bc-title-bn" className="text-sm font-semibold">
                  {t("adm_title_bn")}
                </Label>
                <Input
                  id="bc-title-bn"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="mt-1 rounded-xl bg-white"
                  placeholder="বন্যার পূর্বাভাস"
                />
                <p className="mt-1 text-xs text-muted-foreground">{s(T_TITLE_HELP_BN)}</p>
              </div>
            </div>

            {/* bodies */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="bc-body-en" className="text-sm font-semibold">
                  {t("adm_desc_en")}
                </Label>
                <Textarea
                  id="bc-body-en"
                  rows={3}
                  value={bodyEn}
                  onChange={(e) => setBodyEn(e.target.value)}
                  className="mt-1 rounded-xl bg-white"
                  placeholder="Move to higher ground..."
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="bc-body-bn" className="text-sm font-semibold">
                  {t("adm_desc_bn")}
                </Label>
                <Textarea
                  id="bc-body-bn"
                  rows={3}
                  value={bodyBn}
                  onChange={(e) => setBodyBn(e.target.value)}
                  className="mt-1 rounded-xl bg-white"
                  placeholder="উঁচু স্থানে চলে যান..."
                />
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {s(T_BODY_HELP)}
                </p>
              </div>
            </div>

            {/* severity */}
            <div className="max-w-xs">
              <Label className="text-sm font-semibold">{t("not_emergency_zone")}</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as "high" | "critical")}
              >
                <SelectTrigger className="mt-1 w-full rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-hidden="true" />
                      {s(T_HIGH)}
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-brand-red animate-pulse-dot"
                        aria-hidden="true"
                      />
                      {s(T_CRITICAL)}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">{s(T_SEV_HELP)}</p>
            </div>

            {/* send */}
            <Button
              onClick={send}
              disabled={sending}
              size="lg"
              className="h-12 w-full rounded-full brand-gradient text-base font-bold shadow-sm"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              )}
              {t("adm_send")}
            </Button>
          </div>
        </div>

        {/* live preview */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-muted/50 p-5 ring-1 ring-black/5">
            <p className="font-bold tracking-tight">{s(T_PREVIEW)}</p>
            <p className="mb-3 text-xs text-muted-foreground">{s(T_PREVIEW_SUB)}</p>
            {/* mini popup mimic */}
            <div
              className={cn(
                "overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/10 transition-colors",
                severity === "critical" && "ring-2 ring-brand-red/40"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-widest text-white",
                  severity === "critical" ? "bg-brand-red" : "bg-orange-500",
                  severity === "critical" && "animate-blink"
                )}
              >
                <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                {t("pop_live")}
              </div>
              <div className="p-4">
                <p className="font-bold leading-snug">
                  {L({ en: titleEn || "Title...", bn: titleBn || "শিরোনাম..." })}
                </p>
                <p className="mt-1 line-clamp-4 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  {L({ en: bodyEn || "Message body...", bn: bodyBn || "বার্তার বডি..." })}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs">
                  <span className="font-semibold text-brand-red">{t("pop_details")}</span>
                  <span className="text-muted-foreground">
                    {t("pop_cancel_in")} 10s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* history */}
      <div className="mt-7">
        <h3 className="mb-3 font-bold tracking-tight">{s(T_LIST_TITLE)}</h3>
        {broadcasts === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
            <Megaphone className="mx-auto h-9 w-9 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-2 text-sm text-muted-foreground">{s(T_EMPTY)}</p>
          </div>
        ) : (
          <motion.div
            key={broadcasts.length}
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {[...active, ...inactive].map((b) => (
              <motion.div
                key={b.id}
                variants={fadeUp}
                transition={{ ease: EASE }}
                className={cn(
                  "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5",
                  !b.active && "opacity-60 grayscale-[30%]"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {sevChip(b)}
                  {!b.active && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {s(T_INACTIVE)}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    <AppIcon name="Globe2" className="mr-1 inline h-3 w-3" />
                    {s(T_SRC[b.source])}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDate(b.created_at)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{L(b.title)}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{L(b.body)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {b.active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === b.id}
                        onClick={() => setDeactivateTarget(b)}
                        className="h-8 rounded-full bg-white px-3 text-xs font-bold text-brand-red hover:bg-brand-red-soft"
                      >
                        {busyId === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {t("adm_deactivate")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === b.id}
                        onClick={() => patchActive(b, true)}
                        className="h-8 rounded-full bg-white px-3 text-xs font-bold text-brand-green hover:bg-brand-green-soft"
                      >
                        {busyId === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {lang === "bn" ? "আবার চালু" : "Reactivate"}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* deactivate confirmation */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_DEACTIVATE_Q)}
              {deactivateTarget && ` — ${L(deactivateTarget.title)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_DEACTIVATE_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateTarget) patchActive(deactivateTarget, false);
                setDeactivateTarget(null);
              }}
              className="rounded-full bg-brand-red font-bold text-white hover:bg-brand-red-dark"
            >
              {t("adm_deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
