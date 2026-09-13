"use client";

// ============================================================
// Payments Manager — summary chips, status filter tabs (incl. due/cancelled),
// manual payment entry (admin-attributed), responsive table/cards,
// verify / reject / refund / settle-due / cancel-due with confirms
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Inbox,
  Loader2,
  Plus,
  RotateCcw,
  SearchX,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { cn } from "@/lib/utils";
import { EASE, fadeUp, staggerParent } from "@/lib/motion";
import type { Item, LText, Member, PayStatus, PaymentRecord } from "@/lib/types";

/* ---------------- local bilingual strings ---------------- */
const T_SUB: LText = {
  en: "Review member payments — verify genuine ones, reject fake, refund when needed",
  bn: "সদস্যদের পেমেন্ট যাচাই করুন — সঠিক হলে ভেরিফাই, ভুয়া হলে বাতিল, দরকার হলে ফেরত",
};
const T_COLLECTED: LText = { en: "collected", bn: "সংগ্রহ" };
const T_PENDING_NOW: LText = { en: "pending review", bn: "যাচাইয়ের অপেক্ষায়" };
const T_F_ALL: LText = { en: "All", bn: "সব" };
const T_F_PENDING: LText = { en: "Pending", bn: "পেন্ডিং" };
const T_F_SUCCESS: LText = { en: "Paid", bn: "পরিশোধিত" };
const T_F_FAILED: LText = { en: "Failed", bn: "ব্যর্থ" };
const T_F_REFUNDED: LText = { en: "Refunded", bn: "ফেরত" };
const T_F_DUE: LText = { en: "Due", bn: "বকেয়া" };
const T_F_CANCELLED: LText = { en: "Cancelled", bn: "বাতিল" };
const T_TH_MEMBER: LText = { en: "Member", bn: "সদস্য" };
const T_TH_ITEM: LText = { en: "Item", bn: "আইটেম" };
const T_TH_AMOUNT: LText = { en: "Amount", bn: "পরিমাণ" };
const T_TH_TXN: LText = { en: "Transaction ID", bn: "ট্রানজেকশন আইডি" };
const T_TH_METHOD: LText = { en: "Method", bn: "মাধ্যম" };
const T_TH_STATUS: LText = { en: "Status", bn: "স্ট্যাটাস" };
const T_TH_DATE: LText = { en: "Date", bn: "তারিখ" };
const T_TH_ACTIONS: LText = { en: "Actions", bn: "কাজ" };
const T_VERIFY_Q: LText = { en: "Verify this payment?", bn: "পেমেন্টটি ভেরিফাই করবেন?" };
const T_VERIFY_D: LText = {
  en: "It will be marked as PAID and counted in the collection total.",
  bn: "এটি 'পরিশোধিত' চিহ্নিত হবে এবং মোট সংগ্রহের হিসাবে যোগ হবে।",
};
const T_REJECT_TITLE: LText = { en: "Reject this payment?", bn: "পেমেন্টটি বাতিল করবেন?" };
const T_REJECT_D: LText = {
  en: "It will be marked as failed. You can write a short reason below (optional).",
  bn: "এটি 'ব্যর্থ' চিহ্নিত হবে। নিচে কারণ লিখতে পারেন (ঐচ্ছিক)।",
};
const T_REJECT_NOTE: LText = { en: "Reason (optional)", bn: "কারণ (ঐচ্ছিক)" };
const T_REFUND_Q: LText = { en: "Refund this payment?", bn: "পেমেন্টটি ফেরত (রিফান্ড) করবেন?" };
const T_REFUND_D: LText = {
  en: "The member's money will be returned and the record marked as refunded.",
  bn: "সদস্যের টাকা ফেরত যাবে এবং রেকর্ডটি 'ফেরত' চিহ্নিত হবে।",
};
const T_EMPTY_TITLE: LText = { en: "No payments found", bn: "কোনো পেমেন্ট পাওয়া যায়নি" };
const T_EMPTY_DESC: LText = {
  en: "When members pay for events, donations or gifts, the records appear here for your review.",
  bn: "সদস্যরা ইভেন্ট, ডোনেশন বা গিফটের টাকা দিলে সেগুলোর রেকর্ড এখানে এসে জমা হবে।",
};
const T_EMPTY_FILTER: LText = {
  en: "Nothing in this filter — try another tab.",
  bn: "এই ফিল্টারে কিছু নেই — অন্য ট্যাবে দেখুন।",
};
const T_VERIFIED: LText = { en: "Payment verified", bn: "পেমেন্ট ভেরিফাই হয়েছে" };
const T_REJECTED: LText = { en: "Payment rejected", bn: "পেমেন্ট বাতিল হয়েছে" };
const T_REFUNDED: LText = { en: "Payment refunded", bn: "পেমেন্ট ফেরত হয়েছে" };

/* due-record confirm strings */
const T_SETTLE_Q: LText = {
  en: "Mark this due as paid?",
  bn: "এই বকেয়াটি পরিশোধিত হিসেবে চিহ্নিত করবেন?",
};
const T_SETTLE_D: LText = {
  en: "It will be marked as PAID, counted in the collection total and stamped with your name.",
  bn: "এটি 'পরিশোধিত' চিহ্নিত হবে, মোট সংগ্রহে যোগ হবে এবং আপনার নাম সংরক্ষিত থাকবে।",
};
const T_CXDUE_Q: LText = {
  en: "Cancel this due record?",
  bn: "এই বকেয়া রেকর্ডটি বাতিল করবেন?",
};
const T_CXDUE_D: LText = {
  en: "It will be marked as cancelled and no longer shown as outstanding.",
  bn: "এটি 'বাতিল' চিহ্নিত হবে এবং বকেয়া হিসেবে আর দেখানো হবে না।",
};

/* manual-entry form helper texts */
const T_H_MEMBER: LText = {
  en: "The record will be created under this member's name",
  bn: "রেকর্ডটি এই সদস্যের নামে তৈরি হবে",
};
const T_H_AMOUNT: LText = {
  en: "Collected or due amount in taka",
  bn: "সংগ্রহ বা বকেয়ার পরিমাণ (টাকায়)",
};
const T_H_STATUS: LText = {
  en: "Paid counts in the collection total; Due stays as outstanding",
  bn: "পরিশোধিত হলে মোট সংগ্রহে যোগ হবে; বকেয়া থাকলে পরে মেলাতে পারবেন",
};
const T_H_ITEM: LText = {
  en: "Link it to an event, donation or gift (optional)",
  bn: "ইভেন্ট, ডোনেশন বা গিফটের সাথে যুক্ত করুন (ঐচ্ছিক)",
};
const T_H_NOTE: LText = {
  en: "Anything worth remembering about this record",
  bn: "এই রেকর্ড সম্পর্কে মনে রাখার মতো কিছু লিখুন",
};

const STATUS_LABEL: Record<PayStatus, LText> = {
  pending: { en: "Pending", bn: "পেন্ডিং" },
  submitted: { en: "Submitted", bn: "জমা দেওয়া" },
  success: { en: "Paid", bn: "পরিশোধ" },
  failed: { en: "Failed", bn: "ব্যর্থ" },
  refunded: { en: "Refunded", bn: "ফেরত" },
  due: { en: "Due", bn: "বকেয়া" },
  cancelled: { en: "Cancelled", bn: "বাতিল" },
};

function statusCls(st: PayStatus): string {
  switch (st) {
    case "success":
      return "bg-brand-green-soft text-brand-green-dark";
    case "pending":
    case "submitted":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-brand-red-soft text-brand-red-dark";
    case "due":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-brand-red-soft text-brand-red-dark";
    default:
      return "bg-muted text-muted-foreground";
  }
}

type Filter = "all" | "pending" | "success" | "failed" | "refunded" | "due" | "cancelled";

/** status subset used by the manual-entry form */
type ManualStatus = "success" | "due" | "cancelled";

type ManualForm = {
  member_id: string;
  amount: string;
  status: ManualStatus;
  item_id: string;
  note: string;
};

const EMPTY_FORM: ManualForm = {
  member_id: "",
  amount: "",
  status: "success",
  item_id: "none",
  note: "",
};

/** shared form field wrapper (same pattern as events-manager) */
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

export function PaymentsManager() {
  const { t, L, lang } = useI18n();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  /* reject dialog */
  const [rejectItem, setRejectItem] = useState<PaymentRecord | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  /* confirms */
  const [verifyItem, setVerifyItem] = useState<PaymentRecord | null>(null);
  const [refundItem, setRefundItem] = useState<PaymentRecord | null>(null);
  /* due-record confirms */
  const [settleItem, setSettleItem] = useState<PaymentRecord | null>(null);
  const [cancelDueItem, setCancelDueItem] = useState<PaymentRecord | null>(null);
  /* manual entry dialog */
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<ManualForm>(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/payments?scope=all", { cache: "no-store" });
      const data = await res.json();
      setPayments(data.payments ?? []);
    } catch {
      toast.error(t("error_generic"));
      setPayments([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  /* fetch member + item options when the manual-entry dialog opens */
  const loadAddOptions = useCallback(async () => {
    try {
      const [mRes, iRes] = await Promise.all([
        fetch("/api/members", { cache: "no-store" }),
        fetch("/api/items", { cache: "no-store" }),
      ]);
      const [mJson, iJson] = await Promise.all([mRes.json(), iRes.json()]);
      setMembers(mJson.members ?? []);
      setItems(iJson.items ?? []);
    } catch {
      setMembers([]);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (addOpen) loadAddOptions();
  }, [addOpen, loadAddOptions]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };

  const closeAdd = (open: boolean) => {
    setAddOpen(open);
    if (!open) {
      setForm(EMPTY_FORM);
      setSaving(false);
    }
  };

  const setF = (patch: Partial<ManualForm>) => setForm((f) => ({ ...f, ...patch }));

  const submitAdd = async () => {
    if (!form.member_id) {
      toast.error(t("paym_need_member"));
      return;
    }
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      toast.error(t("paym_need_amount"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: form.member_id,
          item_id: form.item_id === "none" ? null : form.item_id,
          amount,
          status: form.status,
          note: form.note.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("paym_saved"));
      closeAdd(false);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  const collected = useMemo(
    () =>
      (payments ?? [])
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const pendingCount = useMemo(
    () =>
      (payments ?? []).filter((p) => p.status === "pending" || p.status === "submitted")
        .length,
    [payments]
  );

  const filtered = useMemo(() => {
    const list = payments ?? [];
    if (filter === "all") return list;
    if (filter === "pending")
      return list.filter((p) => p.status === "pending" || p.status === "submitted");
    return list.filter((p) => p.status === filter);
  }, [payments, filter]);

  const counts = useMemo(() => {
    const list = payments ?? [];
    return {
      all: list.length,
      pending: list.filter((p) => p.status === "pending" || p.status === "submitted").length,
      success: list.filter((p) => p.status === "success").length,
      failed: list.filter((p) => p.status === "failed").length,
      refunded: list.filter((p) => p.status === "refunded").length,
      due: list.filter((p) => p.status === "due").length,
      cancelled: list.filter((p) => p.status === "cancelled").length,
    };
  }, [payments]);

  const act = async (
    p: PaymentRecord,
    fn: () => Promise<Response>,
    msg: string
  ) => {
    setBusyId(p.id);
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      toast.success(msg);
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  const doVerify = (p: PaymentRecord) =>
    act(p, () =>
      fetch(`/api/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      }),
      s(T_VERIFIED)
    );

  const doReject = (p: PaymentRecord) =>
    act(p, () =>
      fetch(`/api/payments/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", note: rejectNote.trim() || undefined }),
      }),
      s(T_REJECTED)
    );

  const doRefund = (p: PaymentRecord) =>
    act(p, () => fetch(`/api/payments/${p.id}`, { method: "DELETE" }), s(T_REFUNDED));

  const doSettle = (p: PaymentRecord) =>
    act(p, () =>
      fetch("/api/payments/manual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "settle" }),
      }),
      t("paym_settle")
    );

  const doCancelDue = (p: PaymentRecord) =>
    act(p, () =>
      fetch("/api/payments/manual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "cancel" }),
      }),
      t("paym_drop_cancel")
    );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: s(T_F_ALL) },
    { key: "pending", label: s(T_F_PENDING) },
    { key: "success", label: s(T_F_SUCCESS) },
    { key: "due", label: s(T_F_DUE) },
    { key: "cancelled", label: s(T_F_CANCELLED) },
    { key: "failed", label: s(T_F_FAILED) },
    { key: "refunded", label: s(T_F_REFUNDED) },
  ];

  /* ---------- row action buttons (shared by table & cards) ---------- */
  const Actions = ({ p }: { p: PaymentRecord }) => {
    if (p.status === "pending" || p.status === "submitted") {
      return (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            disabled={busyId === p.id}
            onClick={() => setVerifyItem(p)}
            className="h-8 rounded-full bg-brand-green px-3 text-xs font-bold text-white hover:bg-brand-green-dark"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("adm_verify")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === p.id}
            onClick={() => {
              setRejectNote("");
              setRejectItem(p);
            }}
            className="h-8 rounded-full bg-white px-3 text-xs font-bold text-brand-red hover:bg-brand-red-soft"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {t("adm_reject")}
          </Button>
        </div>
      );
    }
    if (p.status === "success") {
      return (
        <Button
          size="sm"
          variant="outline"
          disabled={busyId === p.id}
          onClick={() => setRefundItem(p)}
          className="h-8 rounded-full bg-white px-3 text-xs font-bold text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {t("adm_refund")}
        </Button>
      );
    }
    if (p.status === "due") {
      return (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            disabled={busyId === p.id}
            onClick={() => setSettleItem(p)}
            className="h-8 rounded-full bg-brand-green px-3 text-xs font-bold text-white hover:bg-brand-green-dark"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("paym_settle")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === p.id}
            onClick={() => setCancelDueItem(p)}
            className="h-8 rounded-full bg-white px-3 text-xs font-bold text-brand-red hover:bg-brand-red-soft"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {t("paym_drop_cancel")}
          </Button>
        </div>
      );
    }
    return <span className="text-xs text-muted-foreground">—</span>;
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("adm_payments")}</h2>
          <p className="text-sm text-muted-foreground">{s(T_SUB)}</p>
        </div>
        <Button
          onClick={openAdd}
          size="lg"
          className="h-11 shrink-0 rounded-full brand-gradient px-5 text-sm font-bold shadow-sm"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t("paym_add")}
        </Button>
      </div>

      {/* summary chips */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-green-soft px-4 py-2 text-sm font-bold text-brand-green-dark ring-1 ring-brand-green/20">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          ৳{collected.toLocaleString("en-US")} {s(T_COLLECTED)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 ring-1 ring-amber-300/60">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {pendingCount} {s(T_PENDING_NOW)}
        </span>
      </div>

      {/* filter chips */}
      <div className="nice-scroll mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                active
                  ? "bg-brand-red-soft text-brand-red-dark ring-1 ring-brand-red/25"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-brand-red text-white" : "bg-background text-muted-foreground"
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* content */}
      {payments === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          {payments.length === 0 ? (
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          ) : (
            <SearchX className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          )}
          <p className="mt-3 font-bold">{s(T_EMPTY_TITLE)}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {payments.length === 0 ? s(T_EMPTY_DESC) : s(T_EMPTY_FILTER)}
          </p>
        </div>
      ) : (
        <motion.div
          key={`${filter}-${filtered.length}`}
          variants={staggerParent}
          initial="hidden"
          animate="show"
        >
          {/* desktop table */}
          <div className="nice-scroll hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="rounded-tl-2xl">{s(T_TH_MEMBER)}</TableHead>
                  <TableHead>{s(T_TH_ITEM)}</TableHead>
                  <TableHead className="text-right">{s(T_TH_AMOUNT)}</TableHead>
                  <TableHead>{s(T_TH_TXN)}</TableHead>
                  <TableHead>{s(T_TH_STATUS)}</TableHead>
                  <TableHead>{s(T_TH_DATE)}</TableHead>
                  <TableHead className="rounded-tr-2xl text-right">{s(T_TH_ACTIONS)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <motion.tr
                    key={p.id}
                    variants={fadeUp}
                    className="hover:bg-muted/40"
                    style={{ display: "table-row" }}
                  >
                    <TableCell className="font-semibold">
                      <div>
                        <span className="block">{p.member_name}</span>
                        {p.source === "admin" && (
                          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-brand-green-soft px-2 py-0.5 text-[10px] font-bold text-brand-green-dark">
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            {t("paym_by")} {p.admin_name ?? p.admin_username}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <span className="block truncate text-muted-foreground">
                        {L(p.item_title)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ৳{p.amount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {p.tran_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                          statusCls(p.status)
                        )}
                      >
                        {s(STATUS_LABEL[p.status])}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {fmtDate(p.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Actions p={p} />
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <motion.div
                key={p.id}
                variants={fadeUp}
                transition={{ ease: EASE }}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.member_name}</p>
                    {p.source === "admin" && (
                      <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-brand-green-soft px-2 py-0.5 text-[10px] font-bold text-brand-green-dark">
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        {t("paym_by")} {p.admin_name ?? p.admin_username}
                      </span>
                    )}
                    <p className="truncate text-xs text-muted-foreground">{L(p.item_title)}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      statusCls(p.status)
                    )}
                  >
                    {s(STATUS_LABEL[p.status])}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="text-sm font-bold text-foreground">
                    ৳{p.amount.toLocaleString("en-US")}
                  </span>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {p.tran_id}
                  </code>
                  <span className="inline-flex items-center gap-1">
                    <CreditCard className="h-3 w-3" aria-hidden="true" />
                    {p.method}
                  </span>
                  <span>{fmtDate(p.created_at)}</span>
                </div>
                <div className="mt-3 border-t border-border/70 pt-3">
                  <Actions p={p} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* verify confirm */}
      <AlertDialog open={!!verifyItem} onOpenChange={(o) => !o && setVerifyItem(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_VERIFY_Q)}
              {verifyItem && ` — ${verifyItem.member_name} (৳${verifyItem.amount})`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_VERIFY_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (verifyItem) doVerify(verifyItem);
                setVerifyItem(null);
              }}
              className="rounded-full bg-brand-green font-bold text-white hover:bg-brand-green-dark"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t("adm_verify")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* reject dialog with note */}
      <Dialog open={!!rejectItem} onOpenChange={(o) => !o && setRejectItem(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <XCircle className="h-5 w-5 text-brand-red" aria-hidden="true" />
              {s(T_REJECT_TITLE)}
            </DialogTitle>
            <DialogDescription>
              {rejectItem &&
                `${rejectItem.member_name} — ৳${rejectItem.amount} — ${L(rejectItem.item_title)}`}
              {" — "}
              {s(T_REJECT_D)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Label htmlFor="reject-note" className="text-sm font-semibold">
              {s(T_REJECT_NOTE)}
            </Label>
            <Textarea
              id="reject-note"
              rows={2}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="mt-1 rounded-xl bg-white"
              placeholder={lang === "bn" ? "যেমন: টাকা জমা পাওয়া যায়নি" : "e.g. money not received"}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectItem(null)}
                className="rounded-full bg-white"
              >
                {t("pop_cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (rejectItem) doReject(rejectItem);
                  setRejectItem(null);
                }}
                disabled={busyId === rejectItem?.id}
                className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
              >
                {busyId === rejectItem?.id && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {t("adm_reject")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* refund confirm */}
      <AlertDialog open={!!refundItem} onOpenChange={(o) => !o && setRefundItem(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_REFUND_Q)}
              {refundItem && ` — ${refundItem.member_name} (৳${refundItem.amount})`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_REFUND_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (refundItem) doRefund(refundItem);
                setRefundItem(null);
              }}
              className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("adm_refund")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* settle due confirm */}
      <AlertDialog open={!!settleItem} onOpenChange={(o) => !o && setSettleItem(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_SETTLE_Q)}
              {settleItem && ` — ${settleItem.member_name} (৳${settleItem.amount})`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_SETTLE_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (settleItem) doSettle(settleItem);
                setSettleItem(null);
              }}
              className="rounded-full bg-brand-green font-bold text-white hover:bg-brand-green-dark"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t("paym_settle")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* cancel due confirm */}
      <AlertDialog open={!!cancelDueItem} onOpenChange={(o) => !o && setCancelDueItem(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_CXDUE_Q)}
              {cancelDueItem && ` — ${cancelDueItem.member_name} (৳${cancelDueItem.amount})`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_CXDUE_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelDueItem) doCancelDue(cancelDueItem);
                setCancelDueItem(null);
              }}
              className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t("paym_drop_cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* add payment record dialog */}
      <Dialog open={addOpen} onOpenChange={closeAdd}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-brand-green" aria-hidden="true" />
              {t("paym_add")}
            </DialogTitle>
            <DialogDescription>{t("paym_add_sub")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            {/* member */}
            <Field label={t("paym_member")} helper={s(T_H_MEMBER)} htmlFor="paym-member">
              <Select value={form.member_id} onValueChange={(v) => setF({ member_id: v })}>
                <SelectTrigger id="paym-member" className="w-full rounded-xl bg-white">
                  <SelectValue placeholder={t("paym_member_ph")} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {`${m.full_name} (@${m.username})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* amount */}
            <Field label={s(T_TH_AMOUNT)} helper={s(T_H_AMOUNT)} htmlFor="paym-amount">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  ৳
                </span>
                <Input
                  id="paym-amount"
                  type="number"
                  min={1}
                  value={form.amount}
                  onChange={(e) => setF({ amount: e.target.value })}
                  className="rounded-xl bg-white pl-8"
                  placeholder="0"
                />
              </div>
            </Field>

            {/* status */}
            <Field label={t("paym_status")} helper={s(T_H_STATUS)}>
              <Select
                value={form.status}
                onValueChange={(v) => setF({ status: v as ManualStatus })}
              >
                <SelectTrigger className="w-full rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-green" aria-hidden="true" />
                      {t("adm_paid")}
                    </span>
                  </SelectItem>
                  <SelectItem value="due">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      {t("paym_due")}
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-brand-red" aria-hidden="true" />
                      {t("paym_cancelled")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* related item */}
            <Field label={t("paym_item")} helper={s(T_H_ITEM)}>
              <Select value={form.item_id} onValueChange={(v) => setF({ item_id: v })}>
                <SelectTrigger className="w-full rounded-xl bg-white">
                  <SelectValue placeholder={t("paym_item_none")} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">{t("paym_item_none")}</SelectItem>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {L(it.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* note */}
            <Field label={t("paym_note")} helper={s(T_H_NOTE)} htmlFor="paym-note">
              <Textarea
                id="paym-note"
                rows={2}
                value={form.note}
                onChange={(e) => setF({ note: e.target.value })}
                className="rounded-xl bg-white"
                placeholder={
                  lang === "bn" ? "যেমন: হাতে নগদ নেওয়া হয়েছে" : "e.g. cash received in hand"
                }
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => closeAdd(false)}
                className="rounded-full bg-white"
              >
                {t("pop_cancel")}
              </Button>
              <Button
                onClick={submitAdd}
                disabled={saving}
                className="min-w-32 rounded-full brand-gradient font-bold"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t("paym_add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
