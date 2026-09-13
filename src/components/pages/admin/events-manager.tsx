"use client";

// ============================================================
// Events & Funds Manager — template/custom create dialog,
// beginner-friendly bilingual form, edit / postpone / cancel /
// complete / reactivate / delete lifecycle with confirmations,
// volunteer hours + payment-link copy
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  Info,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { AppIcon, ICON_CHOICES } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TEMPLATES } from "@/data/templates";
import { cn } from "@/lib/utils";
import { EASE, fadeUp, staggerParent } from "@/lib/motion";
import type { Item, ItemKind, ItemStatus, LText, Tpl, TplGroup } from "@/lib/types";

/* ---------------- local bilingual strings ---------------- */
const T_SUB: LText = {
  en: "Create & manage events, donation drives and gift programs",
  bn: "ইভেন্ট, ডোনেশন ও গিফট প্রোগ্রাম তৈরি ও পরিচালনা করুন",
};
const T_HELPER: LText = {
  en: "How it works: 1) Click 'Create New' 2) Pick a ready template or start a blank custom form 3) Fill the fields (Bangla + English) and Save. Later you can Edit, Postpone, Cancel or Delete from the list below.",
  bn: "কীভাবে কাজ করে: ১) 'নতুন তৈরি করুন' চাপুন ২) রেডিমেড টেমপ্লেট বাছুন অথবা খালি ফর্ম দিয়ে শুরু করুন ৩) ঘরগুলো পূরণ করে (বাংলা + English) সেভ করুন। পরে নিচের লিস্ট থেকে সম্পাদনা, স্থগিত, বাতিল বা ডিলিট করতে পারবেন।",
};
const T_NEW_DESC: LText = {
  en: "Pick a ready template to fill most fields automatically — or start a blank custom form.",
  bn: "রেডিমেড টেমপ্লেট বাছলে বেশিরভাগ ঘর নিজে নিজে পূরণ হবে — অথবা খালি কাস্টম ফর্ম দিয়ে শুরু করুন।",
};
const T_TPL_EMPTY: LText = {
  en: "No template in this group",
  bn: "এই গ্রুপে কোনো টেমপ্লেট নেই",
};
const T_CUSTOM_DESC: LText = {
  en: "No template needed — you will get a blank form and fill every field yourself.",
  bn: "টেমপ্লেট লাগবে না — খালি ফর্ম পাবেন, প্রতিটি ঘর নিজেই পূরণ করবেন।",
};
const T_START_BLANK: LText = { en: "Start blank form", bn: "খালি ফর্ম শুরু করুন" };
const T_ICON: LText = { en: "Icon", bn: "আইকন" };
const T_ICON_HELP: LText = {
  en: "Pick a small picture shown beside the title everywhere on the site.",
  bn: "শিরোনামের পাশে সাইটজুড়ে যে ছোট ছবিটি দেখাবে সেটি বাছুন।",
};
const T_TITLE_HELP_EN: LText = {
  en: "Visitors who choose English will see this. Write it in one language, Bangla in the other.",
  bn: "English বেছে নেওয়া ভিজিটররা এটি দেখবে। English একটাতে, বাংলা আরেকটাতে লিখুন।",
};
const T_TITLE_HELP_BN: LText = {
  en: "Visitors who choose Bangla will see this.",
  bn: "বাংলা বেছে নেওয়া ভিজিটররা এটি দেখবে।",
};
const T_KIND_HELP: LText = {
  en: "Event = activity/program, Donation = fund collection, Gift = gift program.",
  bn: "ইভেন্ট = কার্যক্রম/অনুষ্ঠান, ডোনেশন = অর্থ সংগ্রহ, গিফট = উপহার প্রোগ্রাম।",
};
const T_AMOUNT_HELP: LText = {
  en: "Per-member amount in Taka. Keep 0 for free events or open collection drives.",
  bn: "প্রতি সদস্যের জন্য টাকার পরিমাণ। ফ্রি ইভেন্ট বা খোলা সংগ্রহ হলে ০ রাখুন।",
};
const T_PAY_HELP: LText = {
  en: "Whether members must pay online (gateway checkout) for this.",
  bn: "সদস্যদের অনলাইনে টাকা দিতে হবে কি না (গেটওয়ে চেকআউট)।",
};
const T_DEADLINE_HELP: LText = {
  en: "Last date to pay / register (optional).",
  bn: "পেমেন্ট বা রেজিস্ট্রেশনের শেষ তারিখ (ঐচ্ছিক)।",
};
const T_DATE_HELP: LText = {
  en: "The day the event happens (optional).",
  bn: "ইভেন্টটি যে দিনে হবে (ঐচ্ছিক)।",
};
const T_LOCATION_HELP: LText = {
  en: "Where it takes place, e.g. Unit Room, RPI.",
  bn: "কোথায় হবে, যেমন: ইউনিট রুম, আরপিআই।",
};
const T_MAP: LText = { en: "Map link", bn: "ম্যাপ লিংক" };
const T_MAP_HELP: LText = {
  en: "Optional Google Maps link.",
  bn: "ঐচ্ছিক গুগল ম্যাপ লিংক।",
};
const T_NEED_TITLE: LText = {
  en: "Please write the title in Bangla or English first.",
  bn: "আগে বাংলা বা English-এ শিরোনাম লিখুন।",
};
const T_CREATED: LText = {
  en: "Created and live on the site",
  bn: "তৈরি হয়েছে এবং সাইটে চালু",
};
const T_UPDATED: LText = { en: "Changes saved", bn: "পরিবর্তন সংরক্ষিত" };
const T_POSTPONED: LText = { en: "Marked as postponed", bn: "স্থগিত করা হয়েছে" };
const T_CANCELLED: LText = { en: "Cancelled", bn: "বাতিল করা হয়েছে" };
const T_REACTIVATED: LText = { en: "Active again", bn: "আবার চালু হয়েছে" };
const T_DELETED: LText = { en: "Deleted", bn: "মুছে ফেলা হয়েছে" };
const T_CONFIRM_CANCEL: LText = {
  en: "Cancel this item?",
  bn: "এটি কি বাতিল করবেন?",
};
const T_CONFIRM_CANCEL_D: LText = {
  en: "Members will still see it but marked as cancelled — payments stop.",
  bn: "সদস্যরা এটি দেখতে পাবে কিন্তু 'বাতিল' চিহ্নিত হবে — পেমেন্ট বন্ধ হবে।",
};
const T_CONFIRM_COMPLETE: LText = {
  en: "Mark this event as completed?",
  bn: "এই ইভেন্টটি সম্পন্ন হিসাবে চিহ্নিত হবে?",
};
const T_CONFIRM_COMPLETE_D: LText = {
  en: "It will count in the home page stats.",
  bn: "এটি হোম পেজের স্ট্যাটসে গণনা হবে।",
};
const T_CONFIRM_DELETE: LText = { en: "Delete permanently?", bn: "পুরোপুরি মুছে ফেলবেন?" };
const T_CONFIRM_DELETE_D: LText = {
  en: "This removes the item from the site forever. This cannot be undone.",
  bn: "এটি সাইট থেকে চিরতরে মুছে যাবে। আর ফিরিয়ে আনা যাবে না।",
};
const T_POSTPONE_DESC: LText = {
  en: "Set the new date and write a short note — members will see the note on the item.",
  bn: "নতুন তারিখ দিন এবং ছোট একটি নোট লিখুন — সদস্যরা নোটটি দেখবে।",
};
const T_NOTE_BN: LText = { en: "Postpone note (Bangla)", bn: "স্থগিতের নোট (বাংলা)" };
const T_NOTE_EN: LText = { en: "Postpone note (English)", bn: "স্থগিতের নোট (English)" };
const T_EMPTY_TITLE: LText = { en: "No items yet", bn: "এখনো কোনো আইটেম নেই" };
const T_EMPTY_DESC: LText = {
  en: "Create your first event, donation or gift using the red button above.",
  bn: "উপরের লাল বাটন দিয়ে প্রথম ইভেন্ট, ডোনেশন বা গিফট তৈরি করুন।",
};
const T_FREE: LText = { en: "Free", bn: "ফ্রি" };
const T_YOU_LABEL: LText = { en: "amount / member", bn: "পরিমাণ / জন" };

/* ---------------- meta maps ---------------- */
const KIND_META: Record<ItemKind, { label: LText; icon: string }> = {
  event: { label: { en: "Event", bn: "ইভেন্ট" }, icon: "CalendarDays" },
  donation: { label: { en: "Donation", bn: "ডোনেশন" }, icon: "HandHeart" },
  gift: { label: { en: "Gift", bn: "গিফট" }, icon: "Gift" },
};

const STATUS_META: Record<ItemStatus, { label: LText; cls: string }> = {
  active: {
    label: { en: "Active", bn: "চালু" },
    cls: "bg-brand-green-soft text-brand-green-dark",
  },
  postponed: {
    label: { en: "Postponed", bn: "স্থগিত" },
    cls: "bg-amber-100 text-amber-800",
  },
  cancelled: {
    label: { en: "Cancelled", bn: "বাতিল" },
    cls: "bg-brand-red-soft text-brand-red-dark",
  },
  completed: {
    label: { en: "Completed", bn: "সম্পন্ন" },
    cls: "bg-muted text-muted-foreground",
  },
};

const GROUPS: { key: TplGroup | "all"; label: LText; icon: string }[] = [
  { key: "all", label: { en: "All", bn: "সব" }, icon: "Sparkles" },
  { key: "event", label: { en: "Event", bn: "ইভেন্ট" }, icon: "CalendarDays" },
  { key: "donation", label: { en: "Donation", bn: "ডোনেশন" }, icon: "HandHeart" },
  { key: "gift", label: { en: "Gift", bn: "গিফট" }, icon: "Gift" },
  { key: "blood", label: { en: "Blood", bn: "রক্ত" }, icon: "Droplets" },
  { key: "emergency", label: { en: "Emergency", bn: "ইমার্জেন্সি" }, icon: "Siren" },
  { key: "notice", label: { en: "Notice", bn: "নোটিশ" }, icon: "Bell" },
];

/* template defaults carry emoji — strip to honor the no-emoji rule */
function stripEmoji(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------- form state ---------------- */
interface FormState {
  kind: ItemKind;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  icon: string;
  amount: string;
  paymentRequired: boolean;
  deadline: string;
  eventDate: string;
  location: string;
  mapLink: string;
  volunteerHours: string;
}

const BLANK_FORM: FormState = {
  kind: "event",
  titleEn: "",
  titleBn: "",
  descEn: "",
  descBn: "",
  icon: "CalendarDays",
  amount: "",
  paymentRequired: false,
  deadline: "",
  eventDate: "",
  location: "",
  mapLink: "",
  volunteerHours: "",
};

/* ---------------- tiny building blocks ---------------- */
function Field({
  label,
  helper,
  children,
  htmlFor,
}: {
  label: string;
  helper: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{helper}</p>
    </div>
  );
}

export function EventsManager() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);
  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  /* data */
  const [items, setItems] = useState<Item[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/items?kind=all", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      toast.error(t("error_generic"));
      setItems([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  /* dialog state */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [tab, setTab] = useState<"template" | "custom">("template");
  const [group, setGroup] = useState<TplGroup | "all">("all");
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  /* confirm dialogs */
  const [confirm, setConfirm] = useState<
    { type: "cancel" | "delete" | "complete"; item: Item } | null
  >(null);
  const [postponeItem, setPostponeItem] = useState<Item | null>(null);
  const [postDate, setPostDate] = useState("");
  const [postNoteBn, setPostNoteBn] = useState("");
  const [postNoteEn, setPostNoteEn] = useState("");

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const filteredTemplates = useMemo(
    () => (group === "all" ? TEMPLATES : TEMPLATES.filter((tp) => tp.group === group)),
    [group]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setStep("pick");
    setTab("template");
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      kind: item.kind,
      titleEn: item.title.en,
      titleBn: item.title.bn,
      descEn: item.description?.en ?? "",
      descBn: item.description?.bn ?? "",
      icon: item.icon,
      amount: String(item.amount ?? 0),
      paymentRequired: item.payment_required,
      deadline: item.deadline ?? "",
      eventDate: item.event_date ?? "",
      location: item.location ?? "",
      mapLink: item.map_link ?? "",
      volunteerHours: String(item.volunteer_hours ?? 0),
    });
    setStep("form");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setStep("pick");
    setForm(BLANK_FORM);
  };

  const kindForGroup = (g: TplGroup): ItemKind =>
    g === "donation" ? "donation" : g === "gift" ? "gift" : "event";

  const applyTemplate = (tpl: Tpl) => {
    setForm({
      kind: kindForGroup(tpl.group),
      titleEn: stripEmoji(tpl.defaults.title.en),
      titleBn: stripEmoji(tpl.defaults.title.bn),
      descEn: stripEmoji(tpl.defaults.body.en),
      descBn: stripEmoji(tpl.defaults.body.bn),
      icon: tpl.icon,
      amount: "",
      paymentRequired: tpl.group === "donation" || tpl.group === "gift",
      deadline: "",
      eventDate: "",
      location: "",
      mapLink: "",
      volunteerHours: "",
    });
    setStep("form");
  };

  /* ---------- API actions ---------- */
  const save = async () => {
    if (!form.titleEn.trim() && !form.titleBn.trim()) {
      toast.error(s(T_NEED_TITLE));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind: form.kind,
        title: { en: form.titleEn.trim(), bn: form.titleBn.trim() },
        description: { en: form.descEn.trim(), bn: form.descBn.trim() },
        icon: form.icon,
        amount: Number(form.amount) || 0,
        payment_required: form.paymentRequired,
        volunteer_hours: Number(form.volunteerHours) || 0,
        deadline: form.deadline || undefined,
        event_date: form.eventDate || undefined,
        location: form.location.trim() || undefined,
        map_link: form.mapLink.trim() || undefined,
      };
      const res = editing
        ? await fetch(`/api/items/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error();
      toast.success(editing ? s(T_UPDATED) : s(T_CREATED));
      closeDialog();
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (
    item: Item,
    body: Record<string, unknown>,
    msg: string
  ) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(msg);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (item: Item) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(s(T_DELETED));
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  const submitPostpone = async () => {
    if (!postponeItem) return;
    await patchStatus(
      postponeItem,
      {
        status: "postponed",
        event_date: postDate || undefined,
        postpone_note: { en: postNoteEn.trim(), bn: postNoteBn.trim() },
      },
      s(T_POSTPONED)
    );
    setPostponeItem(null);
    setPostNoteBn("");
    setPostNoteEn("");
    setPostDate("");
  };

  const copyPayLink = async (item: Item) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${item.id}`);
      toast.success(t("pay_link_copied"));
    } catch {
      toast.error(t("error_generic"));
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="mx-auto max-w-6xl">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("adm_events")}</h2>
          <p className="text-sm text-muted-foreground">{s(T_SUB)}</p>
        </div>
        <Button
          onClick={openCreate}
          size="lg"
          aria-label={t("adm_new_item")}
          className="group h-11 rounded-full brand-gradient px-5 text-sm font-bold tracking-tight shadow-lg shadow-brand-red/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-red/30 focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90"
            aria-hidden="true"
          >
            <Plus className="size-4 text-white" />
          </span>
          {t("adm_new_item")}
        </Button>
      </div>

      {/* beginner helper strip */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-amber-900 sm:text-sm">{s(T_HELPER)}</p>
      </div>

      {/* list */}
      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-bold">{s(T_EMPTY_TITLE)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s(T_EMPTY_DESC)}</p>
          <Button
            onClick={openCreate}
            aria-label={t("adm_new_item")}
            className="group mt-5 h-10 rounded-full brand-gradient px-5 text-sm font-bold tracking-tight shadow-lg shadow-brand-red/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-red/30 focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-90"
              aria-hidden="true"
            >
              <Plus className="size-3.5 text-white" />
            </span>
            {t("adm_new_item")}
          </Button>
        </div>
      ) : (
        <motion.div
          key={items.length}
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {items.map((item) => {
            const st = STATUS_META[item.status];
            const km = KIND_META[item.kind];
            const busy = busyId === item.id;
            return (
              <motion.div
                key={item.id}
                variants={fadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  {/* icon + main info */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        item.kind === "donation" || item.kind === "gift"
                          ? "bg-brand-green-soft text-brand-green"
                          : "bg-brand-red-soft text-brand-red"
                      )}
                    >
                      <AppIcon name={item.icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold tracking-tight">{L(item.title)}</h3>
                        <Badge className="rounded-full bg-muted px-2 py-0 text-[10px] font-bold text-muted-foreground">
                          <AppIcon name={km.icon} className="mr-1 h-3 w-3" />
                          {s(km.label)}
                        </Badge>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            st.cls
                          )}
                        >
                          {s(st.label)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                        {L(item.description)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {item.amount > 0
                            ? `৳${item.amount.toLocaleString("en-US")} ${s(T_YOU_LABEL)}`
                            : s(T_FREE)}
                          {item.payment_required && item.amount > 0 && (
                            <span className="ml-1.5 rounded-full bg-brand-green-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-green-dark">
                              {t("adm_payment_required")}
                            </span>
                          )}
                        </span>
                        {item.event_date && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" aria-hidden="true" />
                            {fmtDate(item.event_date)}
                          </span>
                        )}
                        {item.deadline && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {t("ev_deadline")}: {fmtDate(item.deadline)}
                          </span>
                        )}
                        {item.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      {item.status === "postponed" && item.postpone_note && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">
                          {L(item.postpone_note)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => openEdit(item)}
                      className="rounded-full bg-white"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("adm_edit")}
                    </Button>
                    {item.payment_required && item.amount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => copyPayLink(item)}
                        className="rounded-full bg-white text-brand-green hover:bg-brand-green-soft"
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("ev_pay_link")}
                      </Button>
                    )}
                    {(item.status === "active" || item.status === "postponed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setPostponeItem(item);
                          setPostDate(item.event_date ?? "");
                        }}
                        className="rounded-full bg-white text-amber-700 hover:bg-amber-50"
                      >
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("adm_postpone")}
                      </Button>
                    )}
                    {(item.status === "active" || item.status === "postponed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setConfirm({ type: "complete", item })}
                        className="rounded-full bg-white text-brand-green hover:bg-brand-green-soft"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("ev_complete")}
                      </Button>
                    )}
                    {(item.status === "active" || item.status === "postponed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setConfirm({ type: "cancel", item })}
                        className="rounded-full bg-white text-brand-red hover:bg-brand-red-soft"
                      >
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("adm_cancel_item")}
                      </Button>
                    )}
                    {item.status === "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          patchStatus(item, { status: "active" }, s(T_REACTIVATED))
                        }
                        className="rounded-full bg-white text-brand-green hover:bg-brand-green-soft"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        {lang === "bn" ? "আবার চালু" : "Reactivate"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setConfirm({ type: "delete", item })}
                      className="rounded-full bg-white text-brand-red hover:bg-brand-red-soft"
                      aria-label={t("adm_delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ---------- create / edit dialog ---------- */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="nice-scroll flex max-h-[85dvh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-black/5 px-5 py-4 sm:px-6">
            <DialogTitle className="pr-8 text-base sm:text-lg">
              {editing ? `${t("adm_edit")} — ${L(editing.title)}` : t("adm_new_item")}
            </DialogTitle>
            {!editing && <DialogDescription>{s(T_NEW_DESC)}</DialogDescription>}
          </DialogHeader>

          <div className="nice-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {/* step 1: template picker */}
          {!editing && step === "pick" && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "template" | "custom")}>
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted p-1">
                <TabsTrigger value="template" className="rounded-lg text-xs sm:text-sm">
                  {t("adm_from_template")}
                </TabsTrigger>
                <TabsTrigger value="custom" className="rounded-lg text-xs sm:text-sm">
                  {t("adm_custom")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="mt-4">
                {/* group chips */}
                <div className="nice-scroll mb-3 flex gap-1.5 overflow-x-auto pb-1">
                  {GROUPS.map((g) => {
                    const active = group === g.key;
                    return (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setGroup(g.key)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                          active
                            ? "bg-brand-red-soft text-brand-red-dark ring-1 ring-brand-red/25"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        )}
                      >
                        <AppIcon name={g.icon} className="h-3.5 w-3.5" />
                        {s(g.label)}
                      </button>
                    );
                  })}
                </div>

                {/* template cards */}
                <div className="nice-scroll grid grid-cols-1 max-h-[52dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="flex items-start gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:ring-brand-red/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-red-soft text-brand-red">
                        <AppIcon name={tpl.icon} className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {L(tpl.title)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {L(tpl.defaults.title)}
                        </span>
                      </span>
                    </button>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                      {s(T_TPL_EMPTY)}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <div className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground ring-1 ring-black/5">
                  {s(T_CUSTOM_DESC)}
                </div>
                <Button
                  onClick={() => {
                    setForm(BLANK_FORM);
                    setStep("form");
                  }}
                  className="mt-3 w-full rounded-full brand-gradient"
                  size="lg"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {s(T_START_BLANK)}
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {/* step 2: shared form */}
          {(!editing || step === "form") && (
            <div className="space-y-4">
              {/* kind */}
              <Field label={t("adm_kind")} helper={s(T_KIND_HELP)}>
                <Select
                  value={form.kind}
                  onValueChange={(v) => set("kind", v as ItemKind)}
                >
                  <SelectTrigger className="w-full rounded-xl bg-white sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_META) as ItemKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">
                          <AppIcon name={KIND_META[k].icon} className="h-4 w-4" />
                          {s(KIND_META[k].label)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* titles */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("adm_title_en")}
                  helper={s(T_TITLE_HELP_EN)}
                  htmlFor="item-title-en"
                >
                  <Input
                    id="item-title-en"
                    value={form.titleEn}
                    onChange={(e) => set("titleEn", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="Blood Donation Camp"
                  />
                </Field>
                <Field
                  label={t("adm_title_bn")}
                  helper={s(T_TITLE_HELP_BN)}
                  htmlFor="item-title-bn"
                >
                  <Input
                    id="item-title-bn"
                    value={form.titleBn}
                    onChange={(e) => set("titleBn", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="রক্তদান কর্মসূচি"
                  />
                </Field>
              </div>

              {/* descriptions */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("adm_desc_en")} helper={s(T_TITLE_HELP_EN)}>
                  <Textarea
                    rows={3}
                    value={form.descEn}
                    onChange={(e) => set("descEn", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="Short description in English..."
                  />
                </Field>
                <Field label={t("adm_desc_bn")} helper={s(T_TITLE_HELP_BN)}>
                  <Textarea
                    rows={3}
                    value={form.descBn}
                    onChange={(e) => set("descBn", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="বাংলায় সংক্ষিপ্ত বর্ণনা..."
                  />
                </Field>
              </div>

              {/* icon picker */}
              <Field label={s(T_ICON)} helper={s(T_ICON_HELP)}>
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

              {/* amount + payment required */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("adm_amount")} helper={s(T_AMOUNT_HELP)} htmlFor="item-amount">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ৳
                    </span>
                    <Input
                      id="item-amount"
                      type="number"
                      min={0}
                      value={form.amount}
                      onChange={(e) => set("amount", e.target.value)}
                      className="rounded-xl bg-white pl-8"
                      placeholder="100"
                    />
                  </div>
                </Field>
                <div className="flex items-end pb-6">
                  <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 ring-1 ring-black/5">
                    <div>
                      <p className="text-sm font-semibold">{t("adm_payment_required")}</p>
                      <p className="text-xs text-muted-foreground">{s(T_PAY_HELP)}</p>
                    </div>
                    <Switch
                      checked={form.paymentRequired}
                      onCheckedChange={(v) => set("paymentRequired", v)}
                      aria-label={t("adm_payment_required")}
                    />
                  </div>
                </div>
              </div>

              {/* volunteer hours */}
              <Field label={t("ev_hours")} helper={t("ev_hours_help")} htmlFor="item-hours">
                <Input
                  id="item-hours"
                  type="number"
                  min={0}
                  value={form.volunteerHours}
                  onChange={(e) => set("volunteerHours", e.target.value)}
                  className="rounded-xl bg-white"
                  placeholder="0"
                />
              </Field>

              {/* dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("adm_deadline")} helper={s(T_DEADLINE_HELP)} htmlFor="item-deadline">
                  <Input
                    id="item-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => set("deadline", e.target.value)}
                    className="rounded-xl bg-white"
                  />
                </Field>
                <Field label={t("adm_event_date")} helper={s(T_DATE_HELP)} htmlFor="item-date">
                  <Input
                    id="item-date"
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    className="rounded-xl bg-white"
                  />
                </Field>
              </div>

              {/* location + map */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("adm_location_ph")} helper={s(T_LOCATION_HELP)}>
                  <Input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="Unit Room, RPI"
                  />
                </Field>
                <Field label={s(T_MAP)} helper={s(T_MAP_HELP)}>
                  <Input
                    value={form.mapLink}
                    onChange={(e) => set("mapLink", e.target.value)}
                    className="rounded-xl bg-white"
                    placeholder="https://maps.google.com/..."
                  />
                </Field>
              </div>

            </div>
          )}
          </div>

          {/* sticky footer actions (edit form, or step-2 of create) */}
          {(editing || step === "form") && (
            <div className="shrink-0 border-t border-black/5 bg-white px-5 py-3 sm:px-6">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog} className="rounded-full bg-white">
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- postpone dialog ---------- */}
      <Dialog
        open={!!postponeItem}
        onOpenChange={(o) => !o && setPostponeItem(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />
              {t("adm_postpone")}
            </DialogTitle>
            <DialogDescription>
              {postponeItem ? L(postponeItem.title) : ""} — {s(T_POSTPONE_DESC)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <Field label={t("adm_event_date")} helper={s(T_DATE_HELP)} htmlFor="postpone-date">
              <Input
                id="postpone-date"
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
                className="rounded-xl bg-white"
              />
            </Field>
            <Field label={s(T_NOTE_BN)} helper={s(T_TITLE_HELP_BN)}>
              <Textarea
                rows={2}
                value={postNoteBn}
                onChange={(e) => setPostNoteBn(e.target.value)}
                className="rounded-xl bg-white"
                placeholder="ভারী বৃষ্টির কারণে স্থগিত — নতুন তারিখ শিগগিরই।"
              />
            </Field>
            <Field label={s(T_NOTE_EN)} helper={s(T_TITLE_HELP_EN)}>
              <Textarea
                rows={2}
                value={postNoteEn}
                onChange={(e) => setPostNoteEn(e.target.value)}
                className="rounded-xl bg-white"
                placeholder="Postponed due to heavy rain — new date soon."
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPostponeItem(null)}
                className="rounded-full bg-white"
              >
                {t("pop_cancel")}
              </Button>
              <Button
                onClick={submitPostpone}
                disabled={busyId === postponeItem?.id}
                className="min-w-28 rounded-full bg-amber-500 font-bold text-white hover:bg-amber-600"
              >
                {busyId === postponeItem?.id && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {t("adm_postpone")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- cancel / delete confirmation ---------- */}
      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "delete"
                ? s(T_CONFIRM_DELETE)
                : confirm?.type === "complete"
                  ? s(T_CONFIRM_COMPLETE)
                  : s(T_CONFIRM_CANCEL)}
              {confirm && ` — ${L(confirm.item.title)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "delete"
                ? s(T_CONFIRM_DELETE_D)
                : confirm?.type === "complete"
                  ? s(T_CONFIRM_COMPLETE_D)
                  : s(T_CONFIRM_CANCEL_D)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirm) return;
                if (confirm.type === "delete") doDelete(confirm.item);
                else if (confirm.type === "complete")
                  patchStatus(confirm.item, { status: "completed" }, t("ev_completed_toast"));
                else patchStatus(confirm.item, { status: "cancelled" }, s(T_CANCELLED));
                setConfirm(null);
              }}
              className={cn(
                "rounded-full font-bold",
                confirm?.type === "delete"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : confirm?.type === "complete"
                    ? "bg-brand-green text-white hover:bg-brand-green/90"
                    : "bg-amber-500 text-white hover:bg-amber-600"
              )}
            >
              {confirm?.type === "delete"
                ? t("adm_delete")
                : confirm?.type === "complete"
                  ? t("ev_complete")
                  : t("adm_cancel_item")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
