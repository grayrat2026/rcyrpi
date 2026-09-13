"use client";

// ============================================================
// Contact Manager — manage the phone numbers & emails shown on
// the public site footer (kind, bilingual label, icon, active)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { AppIcon } from "@/components/shared/app-icon";
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
import type { Contact, LText } from "@/lib/types";

/* ---------------- local bilingual strings (helpers/errors) ---------------- */
const T_KIND_HELP: LText = {
  en: "Phone = hotline numbers in the footer. Email = email addresses.",
  bn: "ফোন = ফুটারের হটলাইন নম্বর। ইমেইল = ইমেইল ঠিকানা।",
};
const T_LABEL_EN_HELP: LText = {
  en: "Short label above the number in English (e.g. National Emergency).",
  bn: "নম্বরের উপরে ইংরেজি ছোট লেবেল (যেমন National Emergency)।",
};
const T_LABEL_BN_HELP: LText = {
  en: "Same label in Bangla (e.g. জাতীয় ইমার্জেন্সি) — optional but recommended.",
  bn: "একই লেবেল বাংলায় (যেমন জাতীয় ইমার্জেন্সি) — ঐচ্ছিক তবে দেওয়া ভালো।",
};
const T_VALUE_HELP_PHONE: LText = {
  en: "Full hotline number visitors should call (e.g. 01700-000000 or 999).",
  bn: "দর্শকেরা যে ফোন নম্বরে কল করবে (যেমন 01700-000000 বা 999)।",
};
const T_VALUE_HELP_EMAIL: LText = {
  en: "Email address visitors can write to (e.g. info@rcyrpi.org).",
  bn: "দর্শকেরা যে ইমেইল ঠিকানায় চিঠি লিখবে (যেমন info@rcyrpi.org)।",
};
const T_ICON_HELP: LText = {
  en: "Small icon shown beside this contact in the footer.",
  bn: "ফুটারে এই যোগাযোগের পাশে ছোট আইকনটি দেখাবে।",
};
const T_ACTIVE_HELP: LText = {
  en: "Turn off to hide it from the footer without deleting.",
  bn: "বন্ধ করলে মুছে না ফেলেই ফুটার থেকে লুকিয়ে যাবে।",
};
const T_ERR_LABEL: LText = { en: "Write the label in English.", bn: "ইংরেজিতে লেবেল লিখুন।" };
const T_ERR_PHONE: LText = {
  en: "Enter a valid phone number (at least 6 digits).",
  bn: "সঠিক ফোন নম্বর দিন (কমপক্ষে ৬ সংখ্যা)।",
};
const T_ERR_EMAIL: LText = {
  en: "Enter a valid email address containing @.",
  bn: "@ চিহ্নসহ সঠিক ইমেইল ঠিকানা দিন।",
};
const T_HIDDEN: LText = { en: "Hidden", bn: "লুকানো" };
const T_DELETE: LText = { en: "Delete", bn: "মুছে ফেলুন" };

/* icon choices for the picker grid (must exist in the AppIcon registry) */
const ICON_CHOICES_CONTACT = [
  "Phone",
  "Mail",
  "Siren",
  "Droplets",
  "Ambulance",
  "Globe2",
  "MessageCircle",
];

interface FormState {
  kind: "phone" | "email";
  labelEn: string;
  labelBn: string;
  value: string;
  icon: string;
  active: boolean;
}

const BLANK: FormState = {
  kind: "phone",
  labelEn: "",
  labelBn: "",
  value: "",
  icon: "Phone",
  active: true,
};

/* ---------------- field with helper text (events-manager style) ---------------- */
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

export function ContactsManager() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<{ labelEn?: string; value?: string }>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  /* ---------- load (admin sees active + inactive) ---------- */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts?scope=all", { cache: "no-store" });
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } catch {
      toast.error(t("error_generic"));
      setContacts([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- list: sort asc, then created_at asc ---------- */
  const sorted = useMemo(() => {
    const list = [...(contacts ?? [])];
    list.sort(
      (a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at)
    );
    return list;
  }, [contacts]);

  const phoneCount = (contacts ?? []).filter((c) => c.kind === "phone").length;
  const emailCount = (contacts ?? []).filter((c) => c.kind === "email").length;

  /* ---------- dialog helpers ---------- */
  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      kind: c.kind,
      labelEn: c.label.en ?? "",
      labelBn: c.label.bn ?? "",
      value: c.value,
      icon: c.icon,
      active: c.active,
    });
    setErrors({});
    setDialogOpen(true);
  };

  /* ---------- validation ---------- */
  const validate = (): boolean => {
    const e: { labelEn?: string; value?: string } = {};
    if (!form.labelEn.trim()) e.labelEn = s(T_ERR_LABEL);
    if (form.kind === "phone") {
      const digits = form.value.replace(/\s+/g, "").replace(/\D/g, "");
      if (digits.length < 6) e.value = s(T_ERR_PHONE);
    } else if (!form.value.includes("@")) {
      e.value = s(T_ERR_EMAIL);
    }
    setErrors(e);
    return !e.labelEn && !e.value;
  };

  /* ---------- save (POST create / PATCH update) ---------- */
  const save = async () => {
    if (!validate()) {
      toast.error(s(form.labelEn.trim() ? T_ERR_PHONE : T_ERR_LABEL));
      return;
    }
    setSaving(true);
    try {
      const nextSort =
        Math.max(0, ...(contacts ?? []).map((c) => c.sort)) + 1;
      const payload = {
        kind: form.kind,
        label: { en: form.labelEn.trim(), bn: form.labelBn.trim() },
        value: form.value.trim(),
        icon: form.icon,
        active: form.active,
        sort: editing ? editing.sort : nextSort,
      };
      const res = await fetch(
        editing ? `/api/contacts/${editing.id}` : "/api/contacts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(t("contact_saved"));
      setDialogOpen(false);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- active toggle ---------- */
  const toggleActive = async (c: Contact) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/contacts/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("contact_saved"));
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  /* ---------- delete ---------- */
  const remove = async (c: Contact) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/contacts/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("contact_deleted"));
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
            {t("contact_title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("contact_sub")}</p>
        </div>
        <Button
          onClick={openAdd}
          className="h-11 rounded-full brand-gradient px-5 font-bold text-white shadow-sm"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("contact_add")}
        </Button>
      </div>

      {/* summary chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-black/5">
          <Phone className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
          {t("contact_phone")}: {phoneCount}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-black/5">
          <Mail className="h-3.5 w-3.5 text-brand-red" aria-hidden="true" />
          {t("contact_email")}: {emailCount}
        </span>
      </div>

      {/* list */}
      {contacts === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <Phone className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">{t("contact_empty")}</p>
        </div>
      ) : (
        <motion.div
          key={sorted.length}
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {sorted.map((c) => {
            const busy = busyId === c.id;
            return (
              <motion.div
                key={c.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: EASE }}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center",
                  !c.active && "opacity-60"
                )}
              >
                {/* icon */}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red-soft text-brand-red">
                  <AppIcon name={c.icon} className="h-5 w-5" />
                </span>

                {/* label + value */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-bold">{L(c.label)}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        c.kind === "phone"
                          ? "bg-brand-green-soft text-brand-green-dark"
                          : "bg-brand-red-soft text-brand-red-dark"
                      )}
                    >
                      {c.kind === "phone" ? t("contact_phone") : t("contact_email")}
                    </span>
                    {!c.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {s(T_HIDDEN)}
                      </span>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">{c.value}</p>
                </div>

                {/* actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => toggleActive(c)}
                    aria-label={c.active ? s(T_HIDDEN) : t("contact_active")}
                    className="h-9 rounded-full bg-white font-bold"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : c.active ? (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(c)}
                    className="h-9 rounded-full bg-white font-bold"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(c)}
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("contact_edit") : t("contact_add")}</DialogTitle>
            <DialogDescription>{t("contact_sub")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* kind */}
            <Field label={t("contact_kind")} helper={s(T_KIND_HELP)}>
              <Select
                value={form.kind}
                onValueChange={(v) => set("kind", v as Contact["kind"])}
              >
                <SelectTrigger className="w-full rounded-xl bg-white sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {t("contact_phone")}
                    </span>
                  </SelectItem>
                  <SelectItem value="email">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {t("contact_email")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* labels */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("contact_label_en")}
                helper={s(T_LABEL_EN_HELP)}
                error={errors.labelEn}
                htmlFor="ct-label-en"
              >
                <Input
                  id="ct-label-en"
                  value={form.labelEn}
                  onChange={(e) => set("labelEn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
              <Field label={t("contact_label_bn")} helper={s(T_LABEL_BN_HELP)}>
                <Input
                  value={form.labelBn}
                  onChange={(e) => set("labelBn", e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </Field>
            </div>

            {/* value */}
            <Field
              label={t("contact_value")}
              helper={
                form.kind === "phone" ? s(T_VALUE_HELP_PHONE) : s(T_VALUE_HELP_EMAIL)
              }
              error={errors.value}
            >
              <Input
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className={cn("h-10 rounded-xl bg-white", form.kind === "phone" && "font-mono")}
                inputMode={form.kind === "phone" ? "tel" : "email"}
              />
            </Field>

            {/* icon picker */}
            <Field label={t("contact_icon")} helper={s(T_ICON_HELP)}>
              <div className="flex flex-wrap gap-2">
                {ICON_CHOICES_CONTACT.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set("icon", name)}
                    aria-label={name}
                    aria-pressed={form.icon === name}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted-foreground ring-1 ring-black/10 transition hover:ring-brand-red/40",
                      form.icon === name && "text-brand-red ring-2 ring-brand-red"
                    )}
                  >
                    <AppIcon name={name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </Field>

            {/* active switch */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t("contact_active")}</p>
                <p className="text-xs text-muted-foreground">{s(T_ACTIVE_HELP)}</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => set("active", v)}
                aria-label={t("contact_active")}
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
              {deleteTarget && ` — ${L(deleteTarget.label)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("contact_delete_confirm")}</AlertDialogDescription>
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
