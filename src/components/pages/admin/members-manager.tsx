"use client";

// ============================================================
// Members Manager — card grid, search, suspend/activate toggle
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Droplet,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { EASE, fadeUp, staggerParent } from "@/lib/motion";
import type { LText, SessionUser } from "@/lib/types";

/* ---------------- local bilingual strings ---------------- */
const T_SUB: LText = {
  en: "All registered members — check details, suspend or restore access",
  bn: "রেজিস্টার্ড সব সদস্য — তথ্য দেখুন, প্রয়োজনে সাসপেন্ড বা ফিরিয়ে আনুন",
};
const T_SEARCH: LText = { en: "Search by name or username...", bn: "নাম বা ইউজারনেম দিয়ে খুঁজুন..." };
const T_SUSPEND_Q: LText = { en: "Suspend this member?", bn: "সদস্যকে সাসপেন্ড করবেন?" };
const T_SUSPEND_D: LText = {
  en: "The member will be logged out and cannot log in until you activate again.",
  bn: "সদস্য লগআউট হয়ে যাবে এবং আপনি আবার চালু না করা পর্যন্ত লগইন করতে পারবে না।",
};
const T_SUSPENDED: LText = { en: "Member suspended", bn: "সদস্য সাসপেন্ড হয়েছে" };
const T_ACTIVATED: LText = { en: "Member activated", bn: "সদস্য চালু হয়েছে" };
const T_ACTIVE: LText = { en: "Active", bn: "চালু" };
const T_SUSPENDED_L: LText = { en: "Suspended", bn: "সাসপেন্ডেড" };
const T_ADMIN: LText = { en: "Admin", bn: "অ্যাডমিন" };
const T_MEMBER: LText = { en: "Member", bn: "সদস্য" };
const T_JOINED: LText = { en: "Joined", bn: "যোগ দিয়েছেন" };
const T_SUSPEND: LText = { en: "Suspend", bn: "সাসপেন্ড" };
const T_ACTIVATE: LText = { en: "Activate", bn: "চালু করুন" };
const T_EMPTY: LText = {
  en: "No member matched your search.",
  bn: "আপনার খোঁজার সাথে কোনো সদস্য মেলেনি।",
};
const T_YOU: LText = { en: "You", bn: "আপনি" };

type AdminMember = SessionUser & {
  status: "active" | "suspended";
  created_at: string;
  alt_phone?: string;
};

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function MembersManager() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const s = (x: LText) => (lang === "bn" ? x.bn : x.en);

  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminMember | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/members", { cache: "no-store" });
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch {
      toast.error(t("error_generic"));
      setMembers([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members ?? [];
    return (members ?? []).filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
    );
  }, [members, query]);

  const setStatus = async (m: AdminMember, status: "active" | "suspended") => {
    setBusyId(m.id);
    try {
      const res = await fetch(`/api/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "suspended" ? s(T_SUSPENDED) : s(T_ACTIVATED));
      load();
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("adm_members")}</h2>
        <p className="text-sm text-muted-foreground">{s(T_SUB)}</p>
      </div>

      {/* search */}
      <div className="relative mb-5 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s(T_SEARCH)}
          className="h-11 rounded-full bg-white pl-9 pr-4 shadow-sm"
          aria-label={s(T_SEARCH)}
        />
      </div>

      {/* grid */}
      {members === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">{s(T_EMPTY)}</p>
        </div>
      ) : (
        <motion.div
          key={filtered.length}
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((m) => {
            const isSelf = m.id === user?.id;
            const busy = busyId === m.id;
            return (
              <motion.div
                key={m.id}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                {/* identity */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-1 ring-black/10">
                    {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.full_name} /> : null}
                    <AvatarFallback className="bg-brand-red-soft font-bold text-brand-red">
                      {initials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-bold">
                      {m.full_name}
                      {isSelf && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {s(T_YOU)}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                  </div>
                </div>

                {/* chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      m.role === "admin"
                        ? "bg-brand-red-soft text-brand-red-dark"
                        : "bg-brand-green-soft text-brand-green-dark"
                    )}
                  >
                    {m.role === "admin" ? s(T_ADMIN) : s(T_MEMBER)}
                  </span>
                  {m.blood_group && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      <Droplet className="h-3 w-3 text-brand-red" aria-hidden="true" />
                      {m.blood_group}
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      m.status === "active"
                        ? "bg-brand-green-soft text-brand-green-dark"
                        : "bg-brand-red-soft text-brand-red-dark"
                    )}
                  >
                    {m.status === "active" ? s(T_ACTIVE) : s(T_SUSPENDED_L)}
                  </span>
                </div>

                {/* contact */}
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {m.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-mono">{m.phone}</span>
                      {m.alt_phone && (
                        <span className="font-mono text-muted-foreground/70">
                          / {m.alt_phone}
                        </span>
                      )}
                    </p>
                  )}
                  {m.email && (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{m.email}</span>
                    </p>
                  )}
                  {m.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {m.address.upazila}, {m.address.district}
                      </span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {s(T_JOINED)}:{" "}
                    {new Date(m.created_at).toLocaleDateString(
                      lang === "bn" ? "bn-BD" : "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>

                {/* status toggle */}
                <div className="mt-auto pt-4">
                  {m.status === "suspended" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => setStatus(m, "active")}
                      className="h-9 w-full rounded-full bg-brand-green font-bold text-white hover:bg-brand-green-dark"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                      )}
                      {s(T_ACTIVATE)}
                    </Button>
                  ) : isSelf ? null : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setSuspendTarget(m)}
                      className="h-9 w-full rounded-full bg-white font-bold text-brand-red hover:bg-brand-red-soft"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      )}
                      {s(T_SUSPEND)}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* suspend confirmation */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {s(T_SUSPEND_Q)}
              {suspendTarget && ` — ${suspendTarget.full_name}`}
            </AlertDialogTitle>
            <AlertDialogDescription>{s(T_SUSPEND_D)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-white">
              {t("pop_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (suspendTarget) setStatus(suspendTarget, "suspended");
                setSuspendTarget(null);
              }}
              className="rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              {s(T_SUSPEND)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
