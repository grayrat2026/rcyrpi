// ============================================================
// Youth Red Crescent Team — RPI
// Central type definitions (Supabase table-shaped)
// Each interface below maps 1:1 to a future Supabase table.
// ============================================================

export type Lang = "en" | "bn";
export type Role = "member" | "admin";

/** Bilingual text — stored as jsonb in Supabase */
export interface LText {
  en: string;
  bn: string;
}

export interface Address {
  district: string; // district en name
  upazila: string;
  thana: string;
  ward: string;
  para: string;
}

/** table: members */
export interface Member {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  alt_phone?: string;
  password_hash: string; // sha256(salt+pw) — verified server-side
  role: Role;
  avatar_url?: string; // data-url / storage url
  blood_group?: string;
  address: Address; // jsonb
  status: "active" | "suspended";
  /** admin-only organisational fields */
  team?: string;
  sub_team?: string;
  member_no?: string;
  /** regular-user optional serving unit (which upazila unit they are under) */
  upazila_unit?: string;
  created_at: string;
}

export type NoticeCategory = "general" | "emergency" | "blood" | "event";
export type Severity = "low" | "medium" | "high" | "critical";

/** table: notices */
export interface Notice {
  id: string;
  title: LText;
  body: LText;
  category: NoticeCategory;
  severity: Severity;
  is_pinned: boolean;
  show_popup: boolean; // urgent -> triggers global popup
  created_by: string;
  created_at: string;
  expires_at?: string;
}

export type ItemKind = "event" | "donation" | "gift";
export type ItemStatus = "active" | "cancelled" | "postponed" | "completed";

/** table: items — events / donations / gifts */
export interface Item {
  id: string;
  kind: ItemKind;
  title: LText;
  description: LText;
  icon: string; // lucide icon name (never emoji) — rendered via AppIcon
  amount: number; // 0 = free / collection drive
  payment_required: boolean;
  deadline?: string;
  event_date?: string;
  location?: string;
  map_link?: string;
  status: ItemStatus;
  postpone_note?: LText;
  /** hours contributed by volunteers (counted when the event completes) */
  volunteer_hours?: number;
  created_by: string;
  created_at: string;
}

export type RequestKind =
  | "blood"
  | "accident"
  | "fire"
  | "flood"
  | "medical"
  | "missing"
  | "other";
export type Urgency =
  | "immediate"
  | "within_1_2_hr"
  | "afternoon"
  | "evening"
  | "tomorrow"
  | "scheduled";

/** table: emergency_requests */
export interface EmergencyRequest {
  id: string;
  kind: RequestKind;
  urgency: Urgency;
  patient_name?: string;
  phone: string;
  alt_phone?: string;
  hospital?: string;
  blood_group?: string;
  patient_type?: string; // pregnant / hand broken / leg broken / surgery / child / elderly
  location?: string; // district
  detail_location?: string;
  needed_at?: string;
  note?: string;
  /** blood bags for kind=blood (default 1) */
  units?: number;
  status: "open" | "fulfilled" | "cancelled";
  created_by?: string;
  created_at: string;
}

export type PayStatus =
  | "pending"
  | "submitted"
  | "success"
  | "failed"
  | "refunded"
  | "due"
  | "cancelled";

/** where a payment record came from */
export type PaySource = "gateway" | "admin";

/** table: payments */
export interface PaymentRecord {
  id: string;
  tran_id: string;
  member_id: string;
  member_name: string;
  item_id: string;
  item_title: LText;
  amount: number;
  method: string; // gateway / mock / admin
  status: PayStatus;
  gateway_ref?: string;
  /** real mobile-wallet TrxID from the gateway (e.g. Nagad "75XODPOF") */
  gateway_trxid?: string;
  /** wallet label from the gateway (e.g. "Nagad Personal") */
  gateway_method?: string;
  sender_number?: string;
  note?: string;
  /** attribution: which admin created/changed this record manually */
  source?: PaySource; // gateway (default) | admin (manual entry)
  admin_username?: string;
  admin_name?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

/** table: templates — emergency / event / donation / gift templates */
export interface TplField {
  key: string;
  label: LText;
  type: "text" | "number" | "tel" | "date" | "time" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  placeholder?: LText;
}

export type TplGroup =
  | "emergency"
  | "blood"
  | "event"
  | "donation"
  | "gift"
  | "notice";

export interface Tpl {
  id: string;
  group: TplGroup;
  icon: string; // lucide icon name key
  title: LText;
  severity: Severity;
  fields: TplField[];
  defaults: { title: LText; body: LText };
}

/** table: broadcasts — global emergency popups */
export interface Broadcast {
  id: string;
  title: LText;
  body: LText;
  severity: "high" | "critical";
  source: "admin" | "auto:earthquake" | "auto:flood" | "request";
  active: boolean;
  link?: string;
  created_at: string;
}

export type SectionKey =
  | "hero"
  | "stats"
  | "emergency_strip"
  | "activities"
  | "events"
  | "schedule"
  | "principles"
  | "about"
  | "join_cta";

/** table: home_sections — drag & drop editable config */
export interface HomeSectionCfg {
  key: SectionKey;
  visible: boolean;
  title?: LText;
  subtitle?: LText;
}

/** table: contacts — admin-manageable emails & phone numbers */
export interface Contact {
  id: string;
  kind: "phone" | "email";
  label: LText;
  value: string;
  icon: string; // lucide icon name (AppIcon)
  active: boolean;
  sort: number;
  created_at: string;
}

export type ScheduleDay = "sat" | "sun" | "mon" | "tue" | "wed" | "thu";

/** table: schedule — admin-controlled weekly schedule rows */
export interface ScheduleRow {
  id: string;
  day: ScheduleDay;
  time_text: string;
  activity: LText;
  place: LText;
  icon: string; // lucide icon name (AppIcon)
  sort: number;
  active: boolean;
  created_at: string;
}

/** activity card shown on home */
export interface Activity {
  id: string;
  icon: string;
  title: LText;
  desc: LText;
  color: "red" | "green";
}

export interface FeedAlert {
  id: string;
  severity: "high" | "critical";
  source: Broadcast["source"];
  title: LText;
  body: LText;
  link?: string;
  created_at: string;
}

/** unified API session user (client mirror) */
export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  avatar_url?: string;
  blood_group?: string;
  phone?: string;
  email?: string;
  address?: Address;
}
