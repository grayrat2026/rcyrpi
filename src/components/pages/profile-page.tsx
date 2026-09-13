"use client";

// ============================================================
// Profile Page — manage the logged-in member's own profile.
// One page, two variants: Regular User + Admin (extra
// "Admin Details" card). Server contract:
//   GET  /api/profile          → { profile }
//   PATCH /api/profile         → { profile }
//   POST /api/profile/password → { ok: true }
// Username is read-only — it can NEVER be changed.
// ============================================================

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Lock,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reveal } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { BLOOD_GROUPS, BD_DISTRICTS, getThanas, getUpazilas } from "@/data/geo";
import { cn } from "@/lib/utils";

/* ---------------- shape returned by GET /api/profile ---------------- */

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  alt_phone?: string;
  role: "member" | "admin";
  avatar_url?: string;
  blood_group?: string;
  address: {
    district: string;
    upazila: string;
    thana: string;
    ward: string;
    para: string;
  };
  status: "active" | "suspended";
  created_at: string;
  team?: string;
  sub_team?: string;
  member_no?: string;
  upazila_unit?: string;
}

/* ---------------- editable form state ---------------- */

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  alt_phone: string;
  blood_group: string;
  avatar_url: string;
  district: string;
  upazila: string;
  thana: string;
  ward: string;
  para: string;
  upazila_unit: string;
  team: string;
  sub_team: string;
  member_no: string;
}

const EMPTY_FORM: FormState = {
  full_name: "",
  email: "",
  phone: "",
  alt_phone: "",
  blood_group: "",
  avatar_url: "",
  district: "",
  upazila: "",
  thana: "",
  ward: "",
  para: "",
  upazila_unit: "",
  team: "",
  sub_team: "",
  member_no: "",
};

type LoadState = "loading" | "ready" | "gate" | "error";

/* ---------- tiny field helper (same language as signup) ---------- */

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-bold text-foreground">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs font-semibold text-brand-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- password field with eye toggle (same as login/signup) ---------- */

function PassField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete = "new-password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-11 rounded-xl pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

/* ---------- card header with soft icon circle ---------- */

function CardHead({
  icon,
  title,
  desc,
  red = false,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  red?: boolean;
}) {
  return (
    <CardHeader>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            red ? "bg-brand-red-soft text-brand-red" : "bg-brand-green-soft text-brand-green"
          )}
        >
          {icon}
        </span>
        <div>
          <CardTitle className="text-base font-extrabold">{title}</CardTitle>
          {desc && <CardDescription className="mt-1 text-xs">{desc}</CardDescription>}
        </div>
      </div>
    </CardHeader>
  );
}

/* ============================================================ */

export function ProfilePage() {
  const { t, lang } = useI18n();
  const { user, setUser } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);

  const M = (bn: string, en: string) => (lang === "bn" ? bn : en);

  /* ---------- load own profile (deferred setState — async IIFE) ---------- */
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { profile?: ProfileData };
        if (!alive) return;
        if (!res.ok || !data.profile) {
          setLoadState(res.status === 401 ? "gate" : "error");
          return;
        }
        const p = data.profile;
        setProfile(p);
        setForm({
          full_name: p.full_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          alt_phone: p.alt_phone ?? "",
          blood_group: p.blood_group ?? "",
          avatar_url: p.avatar_url ?? "",
          district: p.address?.district ?? "",
          upazila: p.address?.upazila ?? "",
          thana: p.address?.thana ?? "",
          ward: p.address?.ward ?? "",
          para: p.address?.para ?? "",
          upazila_unit: p.upazila_unit ?? "",
          team: p.team ?? "",
          sub_team: p.sub_team ?? "",
          member_no: p.member_no ?? "",
        });
        setLoadState("ready");
      } catch {
        if (alive) setLoadState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const set = (k: keyof FormState, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  /* reset dependent selects when district changes (signup pattern) */
  const pickDistrict = (d: string) => {
    setForm((prev) => ({ ...prev, district: d, upazila: "", thana: "", upazila_unit: "" }));
    setErrors((prev) => ({ ...prev, district: "", upazila: "", thana: "" }));
  };

  const upazilas = useMemo(
    () => (form.district ? getUpazilas(form.district) : []),
    [form.district]
  );
  const thanas = useMemo(
    () => (form.district ? getThanas(form.district) : []),
    [form.district]
  );

  /* ---------- avatar (FileReader data-URL, < 300KB — signup rule) ---------- */
  const onAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 300 * 1024) {
      toast.error(M("ছবির সাইজ ৩০০KB এর কম হতে হবে", "Image must be smaller than 300KB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("avatar_url", String(reader.result));
    reader.onerror = () => toast.error(t("error_generic"));
    reader.readAsDataURL(file);
  };

  /* ---------- save (PATCH /api/profile — all editable fields) ---------- */
  const save = async () => {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 3)
      e.full_name = M("পূর্ণ নাম লিখুন (কমপক্ষে ৩ অক্ষর)", "Enter your full name (min 3 characters)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = M("সঠিক ইমেইল ঠিকানা দিন", "Enter a valid email address");
    if (form.phone.replace(/\D/g, "").length < 10)
      e.phone = M("সঠিক ফোন নম্বর দিন (কমপক্ষে ১০ সংখ্যা)", "Enter a valid phone number (min 10 digits)");
    if (form.alt_phone.trim() && form.alt_phone.replace(/\D/g, "").length < 10)
      e.alt_phone = M("বিকল্প ফোন নম্বরটি সঠিক নয়", "Alternative phone number is not valid");
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      toast.error(M("কিছু ঘর ঠিক করুন", "Please fix the highlighted fields"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          alt_phone: form.alt_phone.trim(),
          blood_group: form.blood_group,
          address: {
            district: form.district,
            upazila: form.upazila,
            thana: form.thana,
            ward: form.ward.trim(),
            para: form.para.trim(),
          },
          avatar_url: form.avatar_url,
          upazila_unit: form.upazila_unit,
          team: form.team.trim(),
          sub_team: form.sub_team.trim(),
          member_no: form.member_no.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        profile?: ProfileData;
        error?: string;
      };
      if (!res.ok || !data.profile) {
        if (data.error === "email_taken") toast.error(t("prof_email_taken"));
        else if (data.error === "phone_taken") toast.error(t("prof_phone_taken"));
        else toast.error(t("error_generic"));
        return;
      }
      const p = data.profile;
      setProfile(p);
      // sync header avatar / name immediately
      setUser({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        role: p.role,
        avatar_url: p.avatar_url,
        blood_group: p.blood_group,
        phone: p.phone,
        email: p.email,
        address: p.address,
      });
      toast.success(t("prof_saved"));
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- change password (POST /api/profile/password) ---------- */
  const changePassword = async () => {
    const e: Record<string, string> = {};
    if (!pw.current) e.current = t("required_field");
    if (pw.next.length < 6) e.next = t("prof_pw_short");
    if (pw.confirm !== pw.next || !pw.confirm) e.confirm = t("prof_pw_mismatch");
    setPwErrors(e);
    if (Object.values(e).some(Boolean)) return;

    setPwSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ current_password: pw.current, new_password: pw.next }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        if (data.error === "wrong_password") toast.error(t("prof_pw_wrong"));
        else if (data.error === "pw_short") toast.error(t("prof_pw_short"));
        else toast.error(t("error_generic"));
        return;
      }
      toast.success(t("prof_pw_changed"));
      setPw({ current: "", next: "", confirm: "" });
      setPwErrors({});
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setPwSaving(false);
    }
  };

  /* ---------- formatted member-since date (bn-BD / en-GB) ---------- */
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  /* ---------- login gate (no session) ---------- */
  if (!user || loadState === "gate") {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red-soft"
          >
            <Lock className="h-8 w-8 text-brand-red" aria-hidden="true" />
          </motion.span>
          <h1 className="mt-4 text-lg font-extrabold">{t("prof_title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("prof_login_gate")}
          </p>
          <Button
            asChild
            className="brand-gradient mt-6 h-11 rounded-xl px-8 text-base font-bold text-white hover:opacity-95"
          >
            <Link href="/login">{t("login_btn")}</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ---------- loading skeleton ---------- */
  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-10" aria-busy="true">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------- fetch failed ---------- */
  if (loadState === "error" || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red-soft">
            <AlertCircle className="h-7 w-7 text-brand-red" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-semibold">{t("error_generic")}</p>
          <Button
            onClick={() => setLoadState("loading")}
            className="brand-gradient mt-5 h-10 rounded-xl px-6 text-sm font-bold text-white hover:opacity-95"
          >
            {M("আবার চেষ্টা করুন", "Try again")}
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === "admin";
  const initials = form.full_name.trim().slice(0, 2).toUpperCase() || "RC";
  const roleLabel = isAdmin ? t("prof_role_admin") : t("prof_role_member");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {/* ---------- page header ---------- */}
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="brand-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md">
            <UserRound className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {t("prof_title")}
              </h1>
              <Badge
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  isAdmin ? "bg-brand-red text-white" : "bg-brand-green-soft text-brand-green-dark"
                )}
              >
                {roleLabel}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("prof_sub")}</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {t("prof_member_since")} {fmtDate(profile.created_at)}
            </p>
          </div>
        </div>
        <div className="mt-4 h-1 w-16 rounded-full brand-gradient" />
      </Reveal>

      {/* ---------- editable cards ---------- */}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          save();
        }}
        className="mt-6 space-y-6"
      >
        {/* ===== Account ===== */}
        <Reveal index={1}>
          <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
            <CardHead icon={<UserRound className="h-4.5 w-4.5" />} title={t("prof_account")} />
            <CardContent className="space-y-4">
              {/* avatar */}
              <div className="flex items-center gap-4">
                {form.avatar_url ? (
                  <span className="relative inline-block">
                    { }
                    <img
                      src={form.avatar_url}
                      alt={M("প্রোফাইল ছবির প্রিভিউ", "Profile photo preview")}
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-green/40"
                    />
                    <button
                      type="button"
                      onClick={() => set("avatar_url", "")}
                      aria-label={M("ছবি সরান", "Remove photo")}
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white shadow-md transition hover:scale-110"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="brand-gradient flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-white"
                  >
                    {initials}
                  </span>
                )}
                <div className="space-y-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-red/40 bg-brand-red-soft/40 px-4 py-2.5 text-sm font-bold text-brand-red transition hover:bg-brand-red-soft">
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    {form.avatar_url
                      ? M("ছবি পরিবর্তন করুন", "Change photo")
                      : M("ছবি বাছুন", "Choose photo")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="sr-only"
                      onChange={onAvatar}
                    />
                  </label>
                  <p className="text-[11px] text-muted-foreground">{t("signup_photo_hint")}</p>
                </div>
              </div>

              {/* username — locked forever */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("signup_username")}
                  htmlFor="pf-username"
                  hint={t("prof_username_locked")}
                >
                  <div className="relative">
                    <Input
                      id="pf-username"
                      value={profile.username}
                      readOnly
                      disabled
                      aria-readonly="true"
                      className="h-11 rounded-xl bg-muted pr-10 font-mono text-sm"
                    />
                    <Lock
                      className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </Field>
                <Field label={t("prof_role")}>
                  <Input
                    value={roleLabel}
                    readOnly
                    disabled
                    aria-readonly="true"
                    className="h-11 rounded-xl bg-muted font-semibold"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* ===== Personal ===== */}
        <Reveal index={2}>
          <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
            <CardHead icon={<ShieldCheck className="h-4.5 w-4.5" />} title={t("prof_personal")} />
            <CardContent className="space-y-4">
              <Field label={t("signup_fullname")} htmlFor="pf-name" error={errors.full_name}>
                <Input
                  id="pf-name"
                  value={form.full_name}
                  onChange={(ev) => set("full_name", ev.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="name"
                  placeholder={M("আপনার পূর্ণ নাম", "Your full name")}
                />
              </Field>
              <Field label={t("signup_email")} htmlFor="pf-email" error={errors.email}>
                <Input
                  id="pf-email"
                  type="email"
                  value={form.email}
                  onChange={(ev) => set("email", ev.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("signup_phone")} htmlFor="pf-phone" error={errors.phone}>
                  <Input
                    id="pf-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(ev) => set("phone", ev.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
                <Field label={t("signup_altphone")} htmlFor="pf-alt" error={errors.alt_phone}>
                  <Input
                    id="pf-alt"
                    type="tel"
                    value={form.alt_phone}
                    onChange={(ev) => set("alt_phone", ev.target.value)}
                    className="h-11 rounded-xl"
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
              </div>
              <Field label={t("signup_blood")} htmlFor="pf-blood">
                <Select
                  value={form.blood_group || undefined}
                  onValueChange={(v) => set("blood_group", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="pf-blood" className="h-11 w-full rounded-xl bg-white">
                    <SelectValue placeholder={M("বাছুন", "Select")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{M("প্রযোজ্য নয়", "Not applicable")}</SelectItem>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        </Reveal>

        {/* ===== Address ===== */}
        <Reveal index={3}>
          <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
            <CardHead icon={<ShieldCheck className="h-4.5 w-4.5" />} title={t("prof_address")} />
            <CardContent className="space-y-4">
              <Field label={t("addr_district")}>
                <Select value={form.district || undefined} onValueChange={pickDistrict}>
                  <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                    <SelectValue placeholder={M("জেলা বাছুন", "Select district")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {BD_DISTRICTS.map((d) => (
                      <SelectItem key={d.en} value={d.en}>
                        {lang === "bn" ? d.bn : d.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("addr_upazila")}>
                  <Select
                    value={form.upazila || undefined}
                    onValueChange={(v) => set("upazila", v)}
                    disabled={!form.district}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                      <SelectValue
                        placeholder={
                          form.district ? M("উপজেলা বাছুন", "Select upazila") : t("addr_pick_first")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {upazilas.map(([en, bn]) => (
                        <SelectItem key={en} value={en}>
                          {lang === "bn" ? bn : en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t("addr_thana")}>
                  <Select
                    value={form.thana || undefined}
                    onValueChange={(v) => set("thana", v)}
                    disabled={!form.district}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                      <SelectValue
                        placeholder={
                          form.district ? M("থানা বাছুন", "Select thana") : t("addr_pick_first")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {thanas.map(([en, bn]) => (
                        <SelectItem key={en} value={en}>
                          {lang === "bn" ? bn : en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("addr_ward")} htmlFor="pf-ward">
                  <Input
                    id="pf-ward"
                    type="number"
                    inputMode="numeric"
                    value={form.ward}
                    onChange={(ev) => set("ward", ev.target.value)}
                    className="h-11 rounded-xl"
                    placeholder={M("যেমন: ৫", "e.g. 5")}
                  />
                </Field>
                <Field label={t("addr_para")} htmlFor="pf-para">
                  <Input
                    id="pf-para"
                    value={form.para}
                    onChange={(ev) => set("para", ev.target.value)}
                    className="h-11 rounded-xl"
                    placeholder={M("পাড়া / গ্রামের নাম", "Para / village name")}
                  />
                </Field>
              </div>

              {/* serving unit — everyone, optional */}
              <div className="rounded-xl border border-brand-green/30 bg-brand-green-soft/40 p-4">
                <Field
                  label={t("prof_unit_upazila")}
                  hint={t("prof_unit_upazila_hint")}
                >
                  <Select
                    value={form.upazila_unit || undefined}
                    onValueChange={(v) => set("upazila_unit", v === "none" ? "" : v)}
                    disabled={!form.district}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                      <SelectValue
                        placeholder={
                          form.district
                            ? M("ইউনিট বাছুন (ঐচ্ছিক)", "Select unit (optional)")
                            : t("addr_pick_first")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="none">{M("নেই", "None")}</SelectItem>
                      {upazilas.map(([en, bn]) => (
                        <SelectItem key={en} value={en}>
                          {lang === "bn" ? bn : en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* ===== Admin Details — admin only, always LAST ===== */}
        {isAdmin && (
          <Reveal index={4}>
            <Card className="rounded-2xl shadow-sm ring-1 ring-brand-red/15">
              <CardHead
                red
                icon={<ShieldCheck className="h-4.5 w-4.5" />}
                title={t("prof_admin_zone")}
                desc={t("prof_admin_zone_hint")}
              />
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t("prof_team")} htmlFor="pf-team">
                    <Input
                      id="pf-team"
                      value={form.team}
                      onChange={(ev) => set("team", ev.target.value)}
                      className="h-11 rounded-xl"
                      placeholder={M("যেমন: রক্ত সেবা", "e.g. Blood Service")}
                    />
                  </Field>
                  <Field label={t("prof_sub_team")} htmlFor="pf-subteam">
                    <Input
                      id="pf-subteam"
                      value={form.sub_team}
                      onChange={(ev) => set("sub_team", ev.target.value)}
                      className="h-11 rounded-xl"
                      placeholder={M("যেমন: সমন্বয়", "e.g. Coordination")}
                    />
                  </Field>
                </div>
                <Field label={t("prof_member_no")} htmlFor="pf-memberno">
                  <Input
                    id="pf-memberno"
                    value={form.member_no}
                    onChange={(ev) => set("member_no", ev.target.value)}
                    className="h-11 rounded-xl sm:max-w-xs"
                    placeholder="RPI-RCY-000"
                  />
                </Field>
              </CardContent>
            </Card>
          </Reveal>
        )}

        {/* ===== save ===== */}
        <Reveal index={isAdmin ? 5 : 4}>
          <div className="flex justify-center pb-2">
            <Button
              type="submit"
              disabled={saving}
              className="brand-gradient h-12 rounded-xl px-10 text-base font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? t("prof_saving") : t("prof_save")}
            </Button>
          </div>
        </Reveal>
      </form>

      {/* ===== Change password ===== */}
      <Reveal index={isAdmin ? 6 : 5} className="mt-6">
        <Card className="rounded-2xl shadow-sm ring-1 ring-black/5">
          <CardHead red icon={<Lock className="h-4.5 w-4.5" />} title={t("prof_password")} />
          <CardContent>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                changePassword();
              }}
              className="space-y-4"
            >
              <PassField
                id="pf-pw-current"
                label={t("prof_current_pw")}
                value={pw.current}
                onChange={(v) => setPw((p) => ({ ...p, current: v }))}
                error={pwErrors.current}
                autoComplete="current-password"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PassField
                  id="pf-pw-next"
                  label={t("prof_new_pw")}
                  value={pw.next}
                  onChange={(v) => setPw((p) => ({ ...p, next: v }))}
                  error={pwErrors.next}
                />
                <PassField
                  id="pf-pw-confirm"
                  label={t("prof_confirm_pw")}
                  value={pw.confirm}
                  onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                  error={pwErrors.confirm}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={pwSaving}
                  variant="outline"
                  className="h-11 rounded-xl border-brand-red/40 px-6 font-bold text-brand-red hover:bg-brand-red-soft hover:text-brand-red"
                >
                  {pwSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t("prof_password")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
