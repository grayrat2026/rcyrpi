"use client";

// ============================================================
// Emergency Request Page — kind picker (7 types), dynamic
// fields, urgency radio-cards, inline validation & success
// view. Login-gated (server requires a session).
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Loader2,
  Lock,
  MapPin,
  Moon,
  Phone,
  Search,
  Send,
  Siren,
  Stethoscope,
  Sunrise,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import { BLOOD_GROUPS, BD_DISTRICTS } from "@/data/geo";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/i18n/dictionary";
import type { RequestKind, Urgency } from "@/lib/types";

/* ---------- config ---------- */

const KINDS: {
  key: RequestKind;
  icon: LucideIcon;
  chip: string;
  bn: string;
  en: string;
}[] = [
  { key: "blood", icon: Droplets, chip: "bg-brand-red-soft text-brand-red", bn: "রক্ত", en: "Blood" },
  { key: "accident", icon: Car, chip: "bg-amber-100 text-amber-700", bn: "দুর্ঘটনা", en: "Accident" },
  { key: "fire", icon: Flame, chip: "bg-brand-red-soft text-brand-red", bn: "আগুন", en: "Fire" },
  { key: "flood", icon: Waves, chip: "bg-brand-green-soft text-brand-green", bn: "বন্যা", en: "Flood" },
  { key: "medical", icon: Stethoscope, chip: "bg-brand-green-soft text-brand-green", bn: "চিকিৎসা", en: "Medical" },
  { key: "missing", icon: Search, chip: "bg-zinc-100 text-zinc-600", bn: "নিখোঁজ", en: "Missing" },
  { key: "other", icon: Bell, chip: "bg-brand-green-soft text-brand-green-dark", bn: "অন্যান্য", en: "Other" },
];

const URGENCIES: { key: Urgency; dict: DictKey; icon: LucideIcon; danger?: boolean }[] = [
  { key: "immediate", dict: "urg_immediate", icon: Siren, danger: true },
  { key: "within_1_2_hr", dict: "urg_1_2", icon: Clock },
  { key: "afternoon", dict: "urg_afternoon", icon: Sunrise },
  { key: "evening", dict: "urg_evening", icon: Moon },
  { key: "tomorrow", dict: "urg_tomorrow", icon: CalendarDays },
  { key: "scheduled", dict: "urg_scheduled", icon: Calendar },
];

/** language-independent values stored in DB */
const PATIENT_TYPES: { value: string; dict: DictKey }[] = [
  { value: "Pregnant", dict: "pt_pregnant" },
  { value: "Hand broken", dict: "pt_hand" },
  { value: "Leg broken", dict: "pt_leg" },
  { value: "Surgery", dict: "pt_surgery" },
  { value: "Child", dict: "pt_child" },
  { value: "Elderly", dict: "pt_elderly" },
  { value: "Accident trauma", dict: "pt_accident" },
  { value: "Cancer / Chronic", dict: "pt_cancer" },
  { value: "Other", dict: "pt_other" },
];

/* ============================================================ */

export function RequestPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const [kind, setKind] = useState<RequestKind | null>(null);
  const [urgency, setUrgency] = useState<Urgency>("within_1_2_hr");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [hospital, setHospital] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [patientType, setPatientType] = useState("");
  const [neededAt, setNeededAt] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [wasImmediate, setWasImmediate] = useState(false);

  const M = (bn: string, en: string) => (lang === "bn" ? bn : en);

  // prefill from logged-in member once session hydrates
  useEffect(() => {
    if (!user) return;
    setPhone((p) => p || user.phone || "");
    setLocation((l) => l || user.address?.district || "");
  }, [user]);

  const needPatient = kind === "blood" || kind === "accident" || kind === "medical" || kind === "missing";
  const needHospital = kind === "blood" || kind === "accident" || kind === "medical";
  const needBlood = kind === "blood";
  const detailRequired = kind === "fire" || kind === "flood" || kind === "missing";

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: "" }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!kind) e.kind = M("রিকোয়েস্টের ধরন বাছুন", "Please choose a request type");
    if (phone.replace(/\D/g, "").length < 10)
      e.phone = M("সঠিক ফোন নম্বর দিন (কমপক্ষে ১০ সংখ্যা)", "Enter a valid phone number (min 10 digits)");
    if (altPhone.trim() && altPhone.replace(/\D/g, "").length < 10)
      e.altPhone = M("বিকল্প ফোন নম্বরটি সঠিক নয়", "Alternative phone number is not valid");
    if (!location) e.location = M("জেলা বাছুন", "Select a district");
    if (detailRequired && !detail.trim())
      e.detail = M("পূর্ণ ঠিকানা / এলাকা লিখুন", "Enter the full location / area");
    if (needPatient && !patientName.trim())
      e.patientName = M("রোগীর নাম লিখুন", "Enter the patient name");
    if (needHospital && !hospital.trim())
      e.hospital = M("হাসপাতালের নাম লিখুন", "Enter the hospital name");
    if (needBlood && !bloodGroup) e.bloodGroup = M("রক্তের গ্রুপ বাছুন", "Select a blood group");
    if (urgency === "scheduled" && !neededAt) e.neededAt = M("সময় বাছুন", "Pick a time");
    return e;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.error(M("কিছু ঘর ঠিক করুন", "Please fix the highlighted fields"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          kind,
          urgency,
          phone: phone.trim(),
          alt_phone: altPhone.trim() || undefined,
          location,
          detail_location: detail.trim() || undefined,
          patient_name: needPatient ? patientName.trim() : undefined,
          hospital: needHospital ? hospital.trim() : undefined,
          blood_group: needBlood ? bloodGroup : undefined,
          patient_type: needBlood && patientType ? patientType : undefined,
          needed_at: urgency === "scheduled" ? neededAt : undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) {
        toast.error(t("req_login_note"));
        return;
      }
      if (!res.ok) {
        toast.error(data.error ? t("error_generic") : t("error_generic"));
        return;
      }
      setWasImmediate(urgency === "immediate");
      setSent(true);
      toast.success(t("req_success"));
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setKind(null);
    setUrgency("within_1_2_hr");
    setDetail("");
    setPatientName("");
    setHospital("");
    setBloodGroup("");
    setPatientType("");
    setNeededAt("");
    setNote("");
    setErrors({});
    setSent(false);
  };

  /* ---------- locked state (no session) ---------- */
  if (!user) {
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
          <h1 className="mt-4 text-lg font-extrabold">{t("req_title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("req_login_note")}
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

  /* ---------- success card ---------- */
  if (sent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
          className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 15, delay: 0.15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-green-soft"
          >
            <CheckCircle2 className="h-11 w-11 text-brand-green" aria-hidden="true" />
          </motion.div>
          <h2 className="mt-5 text-xl font-extrabold">{t("req_success")}</h2>
          {wasImmediate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 flex items-center gap-2.5 rounded-xl bg-brand-red-soft p-3.5 text-left ring-1 ring-red-200"
            >
              <Siren className="animate-blink h-5 w-5 shrink-0 text-brand-red" aria-hidden="true" />
              <p className="text-sm font-semibold text-brand-red">
                {M(
                  "সব ভিজিটরের স্ক্রিনে পপআপ সতর্কতা পাঠানো হয়েছে",
                  "A popup alert has been sent to every visitor's screen"
                )}
              </p>
            </motion.div>
          )}
          <Button
            onClick={reset}
            className="brand-gradient mt-6 h-11 rounded-xl px-8 text-base font-bold text-white hover:opacity-95"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {M("আরেকটি রিকোয়েস্ট পাঠান", "Send another request")}
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ---------- main form ---------- */
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-soft ring-1 ring-black/5"
        >
          <Siren className="animate-heartbeat h-7 w-7 text-brand-red" aria-hidden="true" />
        </motion.span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-red sm:text-4xl">
          {t("req_title")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          {t("req_sub")}
        </p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full brand-gradient" />
      </motion.div>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {/* ===== kind picker ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
        >
          <Label className="text-sm font-extrabold">{t("req_kind")}</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {KINDS.map((k) => {
              const Icon = k.icon;
              const sel = kind === k.key;
              return (
                <motion.button
                  key={k.key}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setKind(k.key);
                    clearErr("kind");
                  }}
                  aria-pressed={sel}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition-all sm:p-4",
                    sel
                      ? "scale-105 shadow-md ring-2 ring-brand-red"
                      : "hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-red/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      k.chip
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold sm:text-sm">
                    {lang === "bn" ? k.bn : k.en}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {errors.kind && (
            <p className="mt-2 text-xs font-semibold text-brand-red" role="alert">
              {errors.kind}
            </p>
          )}
        </motion.section>

        {/* ===== kind-specific fields ===== */}
        <AnimatePresence mode="wait" initial={false}>
          {kind && (
            <motion.section
              key={kind}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {needBlood && (
                  <>
                    <FieldShell label={t("req_blood_group")} error={errors.bloodGroup}>
                      <Select
                        value={bloodGroup || undefined}
                        onValueChange={(v) => {
                          setBloodGroup(v);
                          clearErr("bloodGroup");
                        }}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue placeholder={M("রক্তের গ্রুপ", "Blood group")} />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              {bg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldShell>
                    <FieldShell label={t("req_patient_type")}>
                      <Select
                        value={patientType || undefined}
                        onValueChange={setPatientType}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue placeholder={M("বাছুন", "Select")} />
                        </SelectTrigger>
                        <SelectContent>
                          {PATIENT_TYPES.map((pt) => (
                            <SelectItem key={pt.value} value={pt.value}>
                              {t(pt.dict)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldShell>
                  </>
                )}

                {needPatient && (
                  <FieldShell
                    label={t("req_patient_name")}
                    htmlFor="rq-patient"
                    error={errors.patientName}
                  >
                    <Input
                      id="rq-patient"
                      value={patientName}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        clearErr("patientName");
                      }}
                      className="h-11 rounded-xl"
                    />
                  </FieldShell>
                )}

                {needHospital && (
                  <FieldShell
                    label={t("req_hospital")}
                    htmlFor="rq-hospital"
                    error={errors.hospital}
                  >
                    <Input
                      id="rq-hospital"
                      value={hospital}
                      onChange={(e) => {
                        setHospital(e.target.value);
                        clearErr("hospital");
                      }}
                      className="h-11 rounded-xl"
                    />
                  </FieldShell>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ===== contact & location ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.14 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldShell label={t("req_phone")} htmlFor="rq-phone" error={errors.phone}>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="rq-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearErr("phone");
                  }}
                  className="h-11 rounded-xl pl-10"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </FieldShell>

            <FieldShell label={t("req_alt_phone")} htmlFor="rq-alt" error={errors.altPhone}>
              <Input
                id="rq-alt"
                type="tel"
                value={altPhone}
                onChange={(e) => {
                  setAltPhone(e.target.value);
                  clearErr("altPhone");
                }}
                className="h-11 rounded-xl"
                placeholder="01XXXXXXXXX"
              />
            </FieldShell>
          </div>

          <div className="mt-4">
            <FieldShell label={t("req_location")} error={errors.location}>
              <Select
                value={location || undefined}
                onValueChange={(v) => {
                  setLocation(v);
                  clearErr("location");
                }}
              >
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
            </FieldShell>
          </div>

          {/* detail location — emphasized for fire / flood / missing */}
          <div
            className={cn(
              "mt-4 rounded-xl p-3.5",
              detailRequired ? "bg-brand-red-soft/60 ring-1 ring-red-200" : ""
            )}
          >
            <FieldShell
              label={
                detailRequired
                  ? `${t("req_detail_location")} ${M("*", "*")}`
                  : t("req_detail_location")
              }
              htmlFor="rq-detail"
              error={errors.detail}
              bold={detailRequired}
            >
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="rq-detail"
                  value={detail}
                  onChange={(e) => {
                    setDetail(e.target.value);
                    clearErr("detail");
                  }}
                  className="h-11 rounded-xl pl-10"
                  placeholder={
                    kind === "fire" || kind === "flood"
                      ? M("যেমন: রংপুর সদর, শাপলা চত্বারের পাশে", "e.g. near Shapla Chattar, Rangpur Sadar")
                      : M("এলাকা / পূর্ণ ঠিকানা", "Area / full location")
                  }
                />
              </div>
            </FieldShell>
          </div>
        </motion.section>

        {/* ===== urgency ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
        >
          <Label className="text-sm font-extrabold">{t("req_urgency")}</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {URGENCIES.map((u) => {
              const Icon = u.icon;
              const sel = urgency === u.key;
              return (
                <motion.button
                  key={u.key}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setUrgency(u.key)}
                  aria-pressed={sel}
                  className={cn(
                    "flex items-center gap-2 rounded-xl bg-white p-3 text-left ring-1 ring-black/5 transition-all",
                    sel
                      ? "bg-brand-red-soft shadow-md ring-2 ring-brand-red"
                      : "hover:-translate-y-0.5 hover:shadow-sm hover:ring-brand-red/40"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      u.danger || sel ? "text-brand-red" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "text-xs font-bold leading-tight sm:text-[13px]",
                      sel && "text-brand-red"
                    )}
                  >
                    {t(u.dict)}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* scheduled time input */}
          <AnimatePresence initial={false}>
            {urgency === "scheduled" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 max-w-xs">
                  <FieldShell label={t("req_needed_at")} htmlFor="rq-time" error={errors.neededAt}>
                    <Input
                      id="rq-time"
                      type="time"
                      value={neededAt}
                      onChange={(e) => {
                        setNeededAt(e.target.value);
                        clearErr("neededAt");
                      }}
                      className="h-11 rounded-xl"
                    />
                  </FieldShell>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ===== note ===== */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26 }}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5"
        >
          <FieldShell label={t("req_note")} htmlFor="rq-note">
            <Textarea
              id="rq-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="rounded-xl"
              placeholder={
                lang === "bn"
                  ? "অতিরিক্ত তথ্য লিখুন (ল্যান্ডমার্ক, অবস্থা ইত্যাদি)"
                  : "Any extra info (landmark, condition, etc.)"
              }
            />
          </FieldShell>
        </motion.section>

        {/* ===== submit ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
        >
          <Button
            type="submit"
            disabled={loading}
            className="brand-gradient h-12 w-full rounded-2xl text-base font-bold text-white shadow-lg shadow-brand-red/20 hover:opacity-95"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
            {t("req_submit")}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

/* ---------- labeled field shell ---------- */

function FieldShell({
  label,
  htmlFor,
  error,
  bold,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn("text-xs font-bold", bold && "text-brand-red")}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-semibold text-brand-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
