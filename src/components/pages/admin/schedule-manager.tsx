"use client";

// ============================================================
// Schedule Manager — manage the weekly routine rows shown in the
// home page schedule table (day, time, bilingual activity/venue,
// icon, active)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { AppIcon, ICON_CHOICES } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ScheduleDay, ScheduleRow, LText } from "@/lib/types";
import type { DictKey } from "@/i18n/dictionary";

/* ---------------- local bilingual strings (helpers/errors) ---------------- */
const T_DAY_HELP: LText = {
  en: "Which weekday this activity happens on (Bangla week, Friday off).",
  bn: "কার্যক্রমটি কোন বারে হয় (শুক্রবার ছুটি)।",
};
const T_TIME_HELP: LText = {
  en: "Shown in the Time column of the home page table (e.g. 4:00 PM).",
  bn: "হোম পেজের টেবিলের সময় কলামে দেখাবে (যেমন 4:00 PM)।",
};
const T_ACT_EN_HELP: LText = {
  en: "Activity name in English (e.g. First Aid Practice) — required.",
  bn: "কার্যক্রমের নাম ইংরেজিতে (যেমন First Aid Practice) — আবশ্যক।",
};
const T_ACT_BN_HELP: LText = {
  en: "Same activity in Bangla (e.g. প্রাথমিক চিকিৎসা অনুশীলন) — optional but recommended.",
  bn: "একই কার্যক্রম বাংলায় (যেমন প্রাথমিক চিকিৎসা অনুশীলন) — ঐচ্ছিক তবে দেওয়া ভালো।",
};
const T_PLACE_EN_HELP: LText = {
  en: "Venue in English (e.g. Auditorium) — required.",
  bn: "স্থান ইংরেজিতে (যেমন Auditorium) — আবশ্যক।",
};
const T_PLACE_BN_HELP: LText = {
  en: "Same venue in Bangla (e.g. অডিটোরিয়াম) — optional but recommended.",
  bn: "একই স্থান বাংলায় (যেমন অডিটোরিয়াম) — ঐচ্ছিক তবে দেওয়া ভালো।",
};
const T_ICON_HELP: LText = {
  en: "Small icon shown beside this activity in the home page table.",
  bn: "হোম পেজের টেবিলে এই কার্যক্রমের পাশে ছোট আইকনটি দেখাবে।",
};
const T_ACTIVE_HELP: LText = {
  en: "Turn off to hide this row from the home page without deleting.",
  bn: "বন্ধ করলে মুছে না ফেলেই হোম পেজ থেকে লুকিয়ে যাবে।",
};
const T_ERR_ACTIVITY: LText = {
  en: "Write the activity in English.",
  bn: "কার্যক্রমটি ইংরেজিতে লিখুন।",
};
const T_ERR_PLACE: LText = {
  en: "Write the venue in English.",
  bn: "স্থানটি ইংরেজিতে লিখুন।",
};
const T_HIDDEN: LText = { en: "Hidden", bn: "লুকানো" };
const T_DELETE: LText = { en: "Delete", bn: "মুছে ফেলুন" };

/* weekday options (must match the day_* dictionary keys) */
const DAYS: ScheduleDay[] = ["sat", "sun", "mon", "tue", "wed", "thu"];

interface FormState {
  day: ScheduleDay;
  time: string;
  actEn: string;
  actBn: string;
  placeEn: string;
  placeBn: string;
  icon: string;
  active: boolean;
}

const BLANK: FormState = {
  day: "sat",
  time: "",
  actEn: "",
  actBn: "",
  placeEn: "",
  placeBn: "",
  icon: "Sparkles",
  active: true,
};

/* ---------------- field with helper text (contacts-manager style) ---------------- */
function Field({
  label,
  helper,
  error,
  htmlFor,
  children,
}: {
  label: string;
  helper: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helper}</p>
      {error && (
        <p className="mt-1 text-xs font-semibold text-brand-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ScheduleManager() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  const [rows, setRows] = useState<ScheduleRow[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<{ actEn?: string; placeEn?: string }>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRow | null>(null);

  /* ---------- load (admin sees active + inactive) ---------- */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule?scope=all", { cache: "no-store" });
      const data = await res.json();
      setRows(data.schedule ?? []);
    } catch {
      toast.error(t("error_generic"));
      setRows([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- list: sort asc, then created_at asc ---------- */
  const sorted = useMemo(() => {
    const list = [...(rows ?? [])];
    list.sort(
      (a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at)
    );
    return list;
  }, [rows]);

  /* ---------- dialog helpers ---------- */
  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (r: ScheduleRow) => {
    setEditing(r);
    setForm({
      day: r.day,
      time: r.time_text,
      actEn: r.activity.en ?? "",
      actBn: r.activity.bn ?? "",
      placeEn: r.place.en ?? "",
      placeBn: r.place.bn ?? "",
      icon: r.icon,
      active: r.active,
    });
    setErrors({});
    setDialogOpen(true);
  };

  /* ---------- validation ---------- */
  const validate = (): boolean => {
    const e: { actEn?: string; placeEn?: string } = {};
    if (!form.actEn.trim()) e.actEn = s(T_ERR_ACTIVITY);
    if (!form.placeEn.trim()) e.placeEn = s(T_ERR_PLACE);
    setErrors(e);
    return !e.actEn && !e.placeEn;
  };

  /* ---------- save (POST create / PATCH update) ---------- */
  const save = async () => {
    if (!validate()) {
      toast.error(t("error_generic"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        day: form.day,
        time_text: form.time.trim(),
        activity: { en: form.actEn.trim(), bn: form.actBn.trim() || form.actEn.trim() },
        place: { en: form.placeEn.trim(), bn: form.placeBn.trim() || form.placeEn.trim() },
        icon: form.icon,
        active: form.active,
      };
      const res = await fetch(
        editing ? `/api/schedule/${editing.id}` : "/api/schedule",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(t("schm_saved"));
      setDialogOpen(false);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- active toggle ---------- */
  const toggleActive = async (r: ScheduleRow) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/schedule/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !r.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("schm_saved"));
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  /* ---------- delete ---------- */
  const remove = async (r: ScheduleRow) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/schedule/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("schm_deleted"));
      setDeleteTarget(null);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* header + add button */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            {t("schm_title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("schm_sub")}</p>
        </div>
        <Button
          onClick={openAdd}
          className="h-11 rounded-full brand-gradient px-5 font-bold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("schm_add")}
        </Button>
      </div>

      {/* list */}
      {rows === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <CalendarDays
            className="mx-auto h-10 w-10 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm text-muted-foreground">{t("schm_empty")}</p>
        </div>
      ) : (
        <motion.div
          key={sorted.length}
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {sorted.map((r) => {
            const busy = busyId === r.id;
            return (
              <motion.div
                key={r.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center",
                  !r.active && "opacity-60"
                )}
              >
                {/* icon */}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                  <AppIcon name={r.icon} className="h-5 w-5" />
                </span>

                {/* day + activity + time/venue */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-brand-green-soft px-2 py-0.5 text-[10px] font-bold text-brand-green-dark">
                      {t(("day_" + r.day) as DictKey)}
                    </span>
                    <p className="truncate text-sm font-bold">{L(r.activity)}</p>
                    {!r.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {s(T_HIDDEN)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {r.time_text}
                    </span>
                    <span className="flex min-w-0 items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{L(r.place)}</span>
                    </span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => toggleActive(r)}
                    aria-label={r.active ? s(T_HIDDEN) : t("schm_active")}
                    className="h-9 rounded-full bg-white font-bold"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : r.active ? (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(r)}
                    className="h-9 rounded-full bg-white font-bold"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(r)}
                    className="h-9 rounded-full bg-white font-bold text-brand-red hover:bg-brand-red-soft"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader>
            <DialogTitle>{editing ? t("schm_edit") : t("schm_add")}</DialogTitle>
            <DialogDescription>{t("schm_sub")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* day */}
            <Field label={t("schm_day")} helper={s(T_DAY_HELP)}>
              <Select
                value={form.day}
                onValueChange={(v) => set("day", v as ScheduleDay)}
              >
                <SelectTrigger className="w-full rounded-xl bg-white sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(("day_" + d) as DictKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* time */}
            <Field label={t("schm_time")} helper={s(T_TIME_HELP)} htmlFor="sch-time">
              <Input
                id="sch-time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="h-10 rounded-xl bg-white"
                placeholder="4:00 PM"
              />
            </Field>

            {/* activity EN + BN */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("schm_activity_en")}
                helper={s(T_ACT_EN_HELP)}
                error={errors.actEn}
                htmlFor="sch-act-en"
              >
                <Input
                  id="sch-act-en"
                  value={form.actEn}
                  onChange={(e) => set("actEn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
              <Field label={t("schm_activity_bn")} helper={s(T_ACT_BN_HELP)}>
                <Input
                  value={form.actBn}
                  onChange={(e) => set("actBn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
            </div>

            {/* venue EN + BN */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("schm_place_en")}
                helper={s(T_PLACE_EN_HELP)}
                error={errors.placeEn}
                htmlFor="sch-place-en"
              >
                <Input
                  id="sch-place-en"
                  value={form.placeEn}
                  onChange={(e) => set("placeEn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
              <Field label={t("schm_place_bn")} helper={s(T_PLACE_BN_HELP)}>
                <Input
                  value={form.placeBn}
                  onChange={(e) => set("placeBn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
            </div>

            {/* icon picker (events-manager grid pattern) */}
            <Field label={t("schm_icon")} helper={s(T_ICON_HELP)}>
              <div className="nice-scroll grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl bg-muted/50 p-2 sm:grid-cols-9">
                {ICON_CHOICES.map((name) => {
                  const active = form.icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => set("icon", name)}
                      aria-label={name}
                      aria-pressed={active}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                        active
                          ? "bg-brand-red-soft text-brand-red ring-2 ring-brand-red"
                          : "bg-white text-muted-foreground ring-1 ring-black/10 hover:text-foreground"
                      )}
                    >
                      <AppIcon name={name} className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* active switch */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t("schm_active")}</p>
                <p className="text-xs text-muted-foreground">{s(T_ACTIVE_HELP)}</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => set("active", v)}
                aria-label={t("schm_active")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full bg-white"
            >
              {t("pop_cancel")}
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="min-w-32 rounded-full brand-gradient font-bold"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t("adm_save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_DELETE)}
              {deleteTarget && ` — ${L(deleteTarget.activity)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("schm_delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) remove(deleteTarget);
              }}
              className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {s(T_DELETE)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
