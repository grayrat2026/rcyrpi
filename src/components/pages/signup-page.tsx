"use client";

// ============================================================
// Signup Page — 4-step beginner-friendly wizard:
// 1 Account → 2 Personal → 3 Address (real BD geo) → 4 Review
// with animated progress bar, inline validation, avatar upload
// (< 300KB), terms checkbox (shake on fail) & WelcomeScreen
// ============================================================

import {
  Fragment,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HeartPulse,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogoBadge } from "@/components/shared/core";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { useEmergency } from "@/components/providers/emergency-popup";
import { WelcomeScreen } from "@/components/pages/welcome-screen";
import { BLOOD_GROUPS, BD_DISTRICTS, getThanas, getUpazilas } from "@/data/geo";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n/dictionary";
import type { SessionUser } from "@/lib/types";

const STEPS: { key: DictKey; icon: LucideIcon }[] = [
  { key: "st_account", icon: User },
  { key: "st_personal", icon: HeartPulse },
  { key: "st_address", icon: MapPin },
  { key: "st_review", icon: CheckCircle2 },
];

const SERVER_ERRORS: Record<string, { bn: string; en: string }> = {
  username_taken: { bn: "এই ইউজারনেম আগে থেকেই নেওয়া হয়েছে", en: "This username is already taken" },
  email_taken: { bn: "এই ইমেইল দিয়ে একাউন্ট আছে", en: "An account with this email already exists" },
  phone_taken: { bn: "এই ফোন নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে", en: "This phone number is already registered" },
  invalid_district: { bn: "জেলার নাম সঠিক নয়", en: "The district is not valid" },
};

interface FormState {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  alt_phone: string;
  password: string;
  confirm: string;
  blood_group: string;
  avatar_url: string;
  district: string;
  upazila: string;
  thana: string;
  ward: string;
  para: string;
}

const INITIAL: FormState = {
  username: "",
  full_name: "",
  email: "",
  phone: "",
  alt_phone: "",
  password: "",
  confirm: "",
  blood_group: "",
  avatar_url: "",
  district: "",
  upazila: "",
  thana: "",
  ward: "",
  para: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

/* ---------- tiny field helpers ---------- */

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

function PassField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
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
          autoComplete="new-password"
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="break-words text-right text-sm font-bold">{value || "—"}</span>
    </div>
  );
}

/* ============================================================ */

export function SignupPage() {
  const { t, lang } = useI18n();
  const { user, setUser, refresh: refreshAuth } = useAuth();
  const { refresh } = useEmergency();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [agree, setAgree] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  /* wait for the auth refresh to resolve (same pattern as admin layout) */
  useEffect(() => {
    let alive = true;
    refreshAuth().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // run once on mount — refresh identity changes every render (zustand hook)
  }, []);

  /* already logged in → no signup wizard, go home (never during welcome takeover) */
  useEffect(() => {
    if (ready && user && !done) router.replace("/");
  }, [ready, user, done, router]);

  const M = (bn: string, en: string) => (lang === "bn" ? bn : en);
  const set = (k: keyof FormState, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  // reset dependent selects when district changes
  const pickDistrict = (d: string) => {
    setF((p) => ({ ...p, district: d, upazila: "", thana: "" }));
    setErrors((p) => ({ ...p, district: undefined, upazila: undefined, thana: undefined }));
  };

  const upazilas = f.district ? getUpazilas(f.district) : [];
  const thanas = f.district ? getThanas(f.district) : [];

  /* ---------- avatar ---------- */
  const onAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 300 * 1024) {
      toast.error(M("ছবির সাইজ ৩০০KB এর কম হতে হবে", "Image must be smaller than 300KB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setF((p) => ({ ...p, avatar_url: String(reader.result) }));
    reader.onerror = () => toast.error(t("error_generic"));
    reader.readAsDataURL(file);
  };

  /* ---------- per-step validation ---------- */
  const validate = (idx: number): Errors => {
    const e: Errors = {};
    if (idx === 0) {
      if (!f.username.trim()) e.username = t("required_field");
      else if (!/^[A-Za-z0-9_]{3,}$/.test(f.username.trim()))
        e.username = M(
          "শুধু ইংরেজি অক্ষর, সংখ্যা ও _ — কমপক্ষে ৩ অক্ষর",
          "Use letters, numbers & _ only — minimum 3 characters"
        );
      if (f.full_name.trim().length < 3)
        e.full_name = M(
          "পূর্ণ নাম লিখুন (কমপক্ষে ৩ অক্ষর)",
          "Enter your full name (min 3 characters)"
        );
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
        e.email = M("সঠিক ইমেইল ঠিকানা দিন", "Enter a valid email address");
      if (f.phone.replace(/\D/g, "").length < 10)
        e.phone = M(
          "সঠিক ফোন নম্বর দিন (কমপক্ষে ১০ সংখ্যা)",
          "Enter a valid phone number (min 10 digits)"
        );
      if (f.alt_phone.trim() && f.alt_phone.replace(/\D/g, "").length < 10)
        e.alt_phone = M("বিকল্প ফোন নম্বরটি সঠিক নয়", "Alternative phone number is not valid");
      if (f.password.length < 6)
        e.password = M("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "Password must be at least 6 characters");
      if (f.confirm !== f.password || !f.confirm)
        e.confirm = M("পাসওয়ার্ড দুটি মিলছে না", "Passwords do not match");
    }
    if (idx === 2) {
      if (!f.district) e.district = M("জেলা বাছুন", "Select a district");
      if (!f.upazila) e.upazila = M("উপজেলা বাছুন", "Select an upazila");
      if (!f.thana) e.thana = M("থানা বাছুন", "Select a thana");
      if (!f.para.trim()) e.para = M("পাড়া / গ্রামের নাম লিখুন", "Enter your para / village");
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      toast.error(M("কিছু ঘর ঠিক করুন", "Please fix the highlighted fields"));
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  /* ---------- submit ---------- */
  const submit = async () => {
    if (!agree) {
      toast.error(t("terms_required"));
      setShakeKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          username: f.username.trim(),
          full_name: f.full_name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
          alt_phone: f.alt_phone.trim() || undefined,
          password: f.password,
          avatar_url: f.avatar_url || undefined,
          blood_group: f.blood_group || undefined,
          address: {
            district: f.district,
            upazila: f.upazila,
            thana: f.thana,
            ward: f.ward.trim(),
            para: f.para.trim(),
          },
          agree_terms: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: SessionUser;
        error?: string;
      };
      if (!res.ok || !data.user) {
        const mapped = data.error ? SERVER_ERRORS[data.error] : undefined;
        if (mapped) {
          toast.error(lang === "bn" ? mapped.bn : mapped.en);
          setStep(0); // duplicate username / email / phone → fix on account step
        } else {
          toast.error(t("error_generic"));
        }
        return;
      }
      setUser(data.user);
      refresh();
      setDone(true); // full-screen WelcomeScreen takeover
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- welcome takeover ---------- */
  if (done) {
    return <WelcomeScreen onDone={() => router.push("/")} />;
  }

  /* ---------- already logged in → home ---------- */
  if (ready && user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden="true" />
        <span className="sr-only">{t("loading")}</span>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl bg-white p-5 shadow-xl shadow-brand-red/5 ring-1 ring-black/5 sm:p-8"
      >
        {/* header */}
        <div className="flex items-center gap-3">
          <LogoBadge src="/logos/bdrcs.png" alt="BDRCS" size={40} />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {t("signup_title")}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">{t("signup_sub")}</p>
          </div>
        </div>

        {/* steps indicator + progress */}
        <div className="mt-6">
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const completed = i < step;
              const active = i === step;
              return (
                <Fragment key={s.key}>
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i >= step}
                    className={cn(
                      "flex flex-col items-center gap-1",
                      i < step && "cursor-pointer"
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    <motion.span
                      animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/5 transition-colors",
                        completed && "bg-brand-green text-white",
                        active && "brand-gradient text-white shadow-md",
                        !completed && !active && "bg-muted text-muted-foreground"
                      )}
                    >
                      {completed ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </motion.span>
                    <span
                      className={cn(
                        "text-[10px] font-bold sm:text-xs",
                        active ? "text-brand-red" : completed ? "text-brand-green" : "text-muted-foreground"
                      )}
                    >
                      {t(s.key)}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <span className="mx-1 mt-4 h-0.5 flex-1 rounded-full bg-muted sm:mx-2" aria-hidden="true" />
                  )}
                </Fragment>
              );
            })}
          </div>
          {/* animated progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="brand-gradient h-full rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* ---------- step content ---------- */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 space-y-4"
          >
            {/* ===== STEP 1 — account ===== */}
            {step === 0 && (
              <>
                <Field label={t("signup_username")} htmlFor="su-username" error={errors.username} hint={M("শুধু ইংরেজি অক্ষর / সংখ্যা / _ — কমপক্ষে ৩ অক্ষর", "Letters, numbers & _ only — minimum 3")}>
                  <Input
                    id="su-username"
                    value={f.username}
                    onChange={(e) => set("username", e.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="username"
                    placeholder="rakib_hasan"
                  />
                </Field>
                <Field label={t("signup_fullname")} htmlFor="su-name" error={errors.full_name}>
                  <Input
                    id="su-name"
                    value={f.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="name"
                    placeholder={lang === "bn" ? "আপনার পূর্ণ নাম" : "Your full name"}
                  />
                </Field>
                <Field label={t("signup_email")} htmlFor="su-email" error={errors.email}>
                  <Input
                    id="su-email"
                    type="email"
                    value={f.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t("signup_phone")} htmlFor="su-phone" error={errors.phone}>
                    <Input
                      id="su-phone"
                      type="tel"
                      value={f.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="h-11 rounded-xl"
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                  <Field label={t("signup_altphone")} htmlFor="su-alt" error={errors.alt_phone}>
                    <Input
                      id="su-alt"
                      type="tel"
                      value={f.alt_phone}
                      onChange={(e) => set("alt_phone", e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder="01XXXXXXXXX"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PassField
                    id="su-pass"
                    label={t("signup_password")}
                    value={f.password}
                    onChange={(v) => set("password", v)}
                    error={errors.password}
                  />
                  <PassField
                    id="su-confirm"
                    label={t("signup_confirmpass")}
                    value={f.confirm}
                    onChange={(v) => set("confirm", v)}
                    error={errors.confirm}
                  />
                </div>
              </>
            )}

            {/* ===== STEP 2 — personal ===== */}
            {step === 1 && (
              <>
                <Field label={t("signup_blood")} htmlFor="su-blood">
                  <Select
                    value={f.blood_group || undefined}
                    onValueChange={(v) => set("blood_group", v === "none" ? "" : v)}
                  >
                    <SelectTrigger id="su-blood" className="h-11 w-full rounded-xl bg-white">
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

                <Field label={t("signup_photo")} hint={t("signup_photo_hint")}>
                  {f.avatar_url ? (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="relative inline-block">
                        <img
                          src={f.avatar_url}
                          alt={M("প্রোফাইল ছবির প্রিভিউ", "Profile photo preview")}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-green/40"
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
                      <p className="text-xs text-muted-foreground">{t("signup_photo_hint")}</p>
                    </div>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-red/40 bg-brand-red-soft/40 px-4 py-2.5 text-sm font-bold text-brand-red transition hover:bg-brand-red-soft">
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      {M("ছবি বাছুন", "Choose photo")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        onChange={onAvatar}
                      />
                    </label>
                  )}
                </Field>
              </>
            )}

            {/* ===== STEP 3 — address ===== */}
            {step === 2 && (
              <>
                <Field label={t("addr_district")} error={errors.district}>
                  <Select value={f.district || undefined} onValueChange={pickDistrict}>
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
                  <Field label={t("addr_upazila")} error={errors.upazila}>
                    <Select
                      value={f.upazila || undefined}
                      onValueChange={(v) => set("upazila", v)}
                      disabled={!f.district}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                        <SelectValue
                          placeholder={f.district ? M("উপজেলা বাছুন", "Select upazila") : t("addr_pick_first")}
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

                  <Field label={t("addr_thana")} error={errors.thana}>
                    <Select
                      value={f.thana || undefined}
                      onValueChange={(v) => set("thana", v)}
                      disabled={!f.district}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                        <SelectValue
                          placeholder={f.district ? M("থানা বাছুন", "Select thana") : t("addr_pick_first")}
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
                  <Field label={t("addr_ward")} htmlFor="su-ward">
                    <Input
                      id="su-ward"
                      type="number"
                      inputMode="numeric"
                      value={f.ward}
                      onChange={(e) => set("ward", e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder={lang === "bn" ? "যেমন: ৫" : "e.g. 5"}
                    />
                  </Field>
                  <Field label={t("addr_para")} htmlFor="su-para" error={errors.para}>
                    <Input
                      id="su-para"
                      value={f.para}
                      onChange={(e) => set("para", e.target.value)}
                      className="h-11 rounded-xl"
                      placeholder={lang === "bn" ? "পাড়া / গ্রামের নাম" : "Para / village name"}
                    />
                  </Field>
                </div>

                <p className="text-[11px] font-medium text-muted-foreground">
                  {M(
                    "সকল জেলা-উপজেলা-থানা তালিকা সরকারি তথ্য অনুযায়ী",
                    "All district-upazila-thana lists follow official government data"
                  )}
                </p>
              </>
            )}

            {/* ===== STEP 4 — review ===== */}
            {step === 3 && (
              <>
                <ReviewGroup step={0} icon={User} title={t("st_account")} onEdit={setStep}>
                  <ReviewRow label={t("signup_username")} value={f.username} />
                  <ReviewRow label={t("signup_fullname")} value={f.full_name} />
                  <ReviewRow label={t("signup_email")} value={f.email} />
                  <ReviewRow label={t("signup_phone")} value={f.phone} />
                  {f.alt_phone && <ReviewRow label={t("signup_altphone")} value={f.alt_phone} />}
                </ReviewGroup>

                <ReviewGroup step={1} icon={HeartPulse} title={t("st_personal")} onEdit={setStep}>
                  <ReviewRow label={t("signup_blood")} value={f.blood_group} />
                  <ReviewRow
                    label={t("signup_photo")}
                    value={f.avatar_url ? M("যোগ করা হয়েছে", "Added") : M("নেই", "None")}
                  />
                </ReviewGroup>

                <ReviewGroup step={2} icon={MapPin} title={t("st_address")} onEdit={setStep}>
                  <ReviewRow
                    label={t("addr_district")}
                    value={lang === "bn"
                      ? BD_DISTRICTS.find((d) => d.en === f.district)?.bn ?? f.district
                      : f.district}
                  />
                  <ReviewRow label={t("addr_upazila")} value={f.upazila} />
                  <ReviewRow label={t("addr_thana")} value={f.thana} />
                  <ReviewRow label={t("addr_ward")} value={f.ward} />
                  <ReviewRow label={t("addr_para")} value={f.para} />
                </ReviewGroup>

                {/* terms checkbox — shake on fail */}
                <motion.div
                  key={shakeKey}
                  animate={shakeKey > 0 ? { x: [0, -9, 9, -6, 6, -2, 0] } : undefined}
                  transition={{ duration: 0.45 }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    agree
                      ? "border-brand-green/40 bg-brand-green-soft/50"
                      : "border-red-200 bg-brand-red-soft/40"
                  )}
                >
                  <Checkbox
                    id="su-agree"
                    checked={agree}
                    onCheckedChange={(v) => setAgree(v === true)}
                    className="mt-0.5 h-5 w-5 rounded-md"
                  />
                  <label
                    htmlFor="su-agree"
                    className="cursor-pointer text-sm font-medium leading-snug"
                  >
                    {t("terms_agree")}{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brand-red underline decoration-brand-red/40 underline-offset-2 hover:decoration-brand-red"
                    >
                      {t("terms_link")}
                    </Link>
                  </label>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ---------- nav buttons ---------- */}
        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={loading}
              className="h-11 flex-1 rounded-xl font-bold ring-1 ring-black/5 sm:flex-none sm:px-6"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t("signup_back")}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={next}
              className="brand-gradient h-11 flex-1 rounded-xl font-bold text-white hover:opacity-95"
            >
              {t("signup_next")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={loading}
              className="brand-gradient h-11 flex-1 rounded-xl font-bold text-white hover:opacity-95"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              )}
              {t("signup_submit")}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- review group card ---------- */

function ReviewGroup({
  step,
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  onEdit: (s: number) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-xl p-4 ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-brand-red">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-brand-red transition hover:bg-brand-red-soft"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          {t("adm_edit")}
        </button>
      </div>
      <div className="mt-2 divide-y divide-border/70">{children}</div>
    </div>
  );
}
