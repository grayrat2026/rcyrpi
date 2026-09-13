// ============================================================
// Store — REAL Supabase data layer (replaces mock-db).
// All access is server-side with the service_role key.
// Tables (public): members, notices, items, emergency_requests,
//                  payments, broadcasts, home_sections, contacts
// ============================================================

import { supabaseAdmin } from "@/lib/supabase/client";
import type {
  Member, Notice, Item, EmergencyRequest, PaymentRecord,
  Broadcast, HomeSectionCfg, Contact, ScheduleRow,
} from "@/lib/types";

/** re-export so services/routes can share one import path */
export { supabaseAdmin };

export const SALT = "rcy-rpi-v1";

/** sha256 hex via Web Crypto — works on Node AND edge runtimes */
export async function hashPassword(pw: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(SALT + pw)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const dbNow = () => new Date().toISOString();

const num = (v: unknown, d = 0): number =>
  v === null || v === undefined ? d : Number(v);

/* ---------------- row adapters (numeric cols arrive as strings) ---------------- */

export function toMember(r: any): Member {
  return {
    id: r.id, username: r.username, full_name: r.full_name,
    email: r.email, phone: r.phone, alt_phone: r.alt_phone ?? undefined,
    password_hash: r.password_hash, role: r.role,
    avatar_url: r.avatar_url ?? undefined, blood_group: r.blood_group ?? undefined,
    address: (r.address ?? {}) as Member["address"], status: r.status,
    team: r.team ?? undefined, sub_team: r.sub_team ?? undefined,
    member_no: r.member_no ?? undefined, upazila_unit: r.upazila_unit ?? undefined,
    created_at: r.created_at,
  };
}
export function toNotice(r: any): Notice {
  return {
    id: r.id, title: r.title, body: r.body, category: r.category, severity: r.severity,
    is_pinned: r.is_pinned, show_popup: r.show_popup, created_by: r.created_by ?? undefined,
    created_at: r.created_at, expires_at: r.expires_at ?? undefined,
  };
}
export function toItem(r: any): Item {
  return {
    id: r.id, kind: r.kind, title: r.title, description: r.description,
    icon: r.icon, amount: num(r.amount), payment_required: r.payment_required,
    deadline: r.deadline ?? undefined, event_date: r.event_date ?? undefined,
    location: r.location ?? undefined, map_link: r.map_link ?? undefined,
    status: r.status, postpone_note: r.postpone_note ?? undefined,
    volunteer_hours: num(r.volunteer_hours, 0),
    created_by: r.created_by ?? undefined, created_at: r.created_at,
  };
}
export function toRequest(r: any): EmergencyRequest {
  return {
    id: r.id, kind: r.kind, urgency: r.urgency, patient_name: r.patient_name ?? undefined,
    phone: r.phone, alt_phone: r.alt_phone ?? undefined, hospital: r.hospital ?? undefined,
    blood_group: r.blood_group ?? undefined, patient_type: r.patient_type ?? undefined,
    location: r.location ?? undefined, detail_location: r.detail_location ?? undefined,
    needed_at: r.needed_at ?? undefined, note: r.note ?? undefined,
    units: num(r.units, 1),
    status: r.status, created_by: r.created_by ?? undefined, created_at: r.created_at,
  };
}
export function toPayment(r: any): PaymentRecord {
  return {
    id: r.id, tran_id: r.tran_id, member_id: r.member_id, member_name: r.member_name,
    item_id: r.item_id ?? undefined, item_title: r.item_title,
    amount: num(r.amount), method: r.method, status: r.status,
    gateway_ref: r.gateway_ref ?? undefined, sender_number: r.sender_number ?? undefined,
    gateway_trxid: r.gateway_trxid ?? undefined, gateway_method: r.gateway_method ?? undefined,
    note: r.note ?? undefined,
    source: r.source ?? "gateway", admin_username: r.admin_username ?? undefined,
    admin_name: r.admin_name ?? undefined,
    created_at: r.created_at,
    verified_at: r.verified_at ?? undefined, verified_by: r.verified_by ?? undefined,
  };
}
export function toBroadcast(r: any): Broadcast {
  return {
    id: r.id, title: r.title, body: r.body, severity: r.severity, source: r.source,
    active: r.active, link: r.link ?? undefined, created_at: r.created_at,
  };
}
export function toContact(r: any): Contact {
  return {
    id: r.id, kind: r.kind, label: r.label, value: r.value, icon: r.icon,
    active: r.active, sort: num(r.sort), created_at: r.created_at,
  };
}

/* ---------------- members ---------------- */

const MEMBER_COLS = "id,username,full_name,email,phone,alt_phone,password_hash,role,avatar_url,blood_group,address,status,team,sub_team,member_no,upazila_unit,created_at";

export async function getMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabaseAdmin()
    .from("members").select(MEMBER_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toMember(data) : null;
}

export async function findMemberByLogin(key: string): Promise<Member | null> {
  const k = key.trim().toLowerCase();
  // 1) email / username exact
  const { data, error } = await supabaseAdmin()
    .from("members").select(MEMBER_COLS)
    .or(`email.eq.${k},username.eq.${k}`).limit(1).maybeSingle();
  if (error && error.code !== "40000") {
    // ignore malformed filter errors and fall through to scan
  }
  if (data) return toMember(data);
  // 2) phone digits match (handles +880… / 01… forms)
  const digits = k.replace(/\D/g, "");
  if (digits) {
    const { data: all } = await supabaseAdmin()
      .from("members").select(MEMBER_COLS);
    const hit = (all ?? []).find((r: any) => String(r.phone).replace(/\D/g, "") === digits);
    if (hit) return toMember(hit);
  }
  return null;
}

export async function memberFieldTaken(field: "username" | "email" | "phone", value: string, excludeId?: string): Promise<boolean> {
  if (field === "phone") {
    // compare digit-normalized
    const digits = value.replace(/\D/g, "");
    const { data } = await supabaseAdmin().from("members").select("id,phone");
    return (data ?? []).some((r: any) => {
      if (excludeId && r.id === excludeId) return false;
      return String(r.phone ?? "").replace(/\D/g, "") === digits;
    });
  }
  const { data } = await supabaseAdmin()
    .from("members").select("id")
    .ilike(field, value).limit(5);
  return (data ?? []).some((r: any) => r.id !== excludeId);
}

export async function insertMember(m: Member): Promise<Member> {
  const { error } = await supabaseAdmin().from("members").insert({
    id: m.id, username: m.username, full_name: m.full_name, email: m.email,
    phone: m.phone, alt_phone: m.alt_phone ?? null, password_hash: m.password_hash,
    role: m.role, avatar_url: m.avatar_url ?? null, blood_group: m.blood_group ?? null,
    address: m.address, status: m.status, team: m.team ?? null, sub_team: m.sub_team ?? null,
    member_no: m.member_no ?? null, upazila_unit: m.upazila_unit ?? null, created_at: m.created_at,
  });
  if (error) throw error;
  return m;
}

export async function updateMember(id: string, patch: Partial<Member>): Promise<void> {
  const p: Record<string, unknown> = { ...patch };
  delete p.id;
  const { error } = await supabaseAdmin().from("members").update(p).eq("id", id);
  if (error) throw error;
}

export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabaseAdmin()
    .from("members").select(MEMBER_COLS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMember);
}

/* ---------------- notices ---------------- */

export async function listNotices(category?: string | null): Promise<Notice[]> {
  let q = supabaseAdmin().from("notices").select("*");
  if (category && category !== "all") q = q.eq("category", category);
  const { data, error } = await q
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toNotice);
}

export async function getNotice(id: string): Promise<Notice | null> {
  const { data } = await supabaseAdmin().from("notices").select("*").eq("id", id).maybeSingle();
  return data ? toNotice(data) : null;
}

export async function insertNotice(n: Notice): Promise<Notice> {
  const { error } = await supabaseAdmin().from("notices").insert({
    id: n.id, title: n.title, body: n.body, category: n.category, severity: n.severity,
    is_pinned: n.is_pinned, show_popup: n.show_popup, created_by: n.created_by ?? null,
    created_at: n.created_at, expires_at: n.expires_at ?? null,
  });
  if (error) throw error;
  return n;
}

const NOTICE_FIELDS = ["title", "body", "category", "severity", "is_pinned", "show_popup", "expires_at"] as const;

export async function updateNotice(id: string, patch: Record<string, unknown>): Promise<Notice | null> {
  const p: Record<string, unknown> = {};
  for (const k of NOTICE_FIELDS) if (k in patch) p[k] = patch[k];
  if (!Object.keys(p).length) return getNotice(id);
  const { error } = await supabaseAdmin().from("notices").update(p).eq("id", id);
  if (error) throw error;
  return getNotice(id);
}

export async function deleteNotice(id: string): Promise<void> {
  await supabaseAdmin().from("notices").delete().eq("id", id);
}

/* ---------------- items ---------------- */

export async function listItems(kind?: string | null): Promise<Item[]> {
  let q = supabaseAdmin().from("items").select("*");
  if (kind && kind !== "all") q = q.eq("kind", kind);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toItem);
}

export async function getItem(id: string): Promise<Item | null> {
  const { data } = await supabaseAdmin().from("items").select("*").eq("id", id).maybeSingle();
  return data ? toItem(data) : null;
}

export async function insertItem(i: Item): Promise<Item> {
  const { error } = await supabaseAdmin().from("items").insert({
    id: i.id, kind: i.kind, title: i.title, description: i.description, icon: i.icon,
    amount: i.amount, payment_required: i.payment_required, deadline: i.deadline ?? null,
    event_date: i.event_date ?? null, location: i.location ?? null, map_link: i.map_link ?? null,
    status: i.status, postpone_note: i.postpone_note ?? null,
    volunteer_hours: Math.max(0, Math.floor(i.volunteer_hours ?? 0)),
    created_by: i.created_by ?? null,
    created_at: i.created_at,
  });
  if (error) throw error;
  return i;
}

const ITEM_FIELDS = ["kind", "title", "description", "icon", "amount", "payment_required", "deadline", "event_date", "location", "map_link", "status", "postpone_note", "volunteer_hours"] as const;

export async function updateItem(id: string, patch: Record<string, unknown>): Promise<Item | null> {
  const p: Record<string, unknown> = {};
  for (const k of ITEM_FIELDS) if (k in patch) p[k] = patch[k];
  if (!Object.keys(p).length) return getItem(id);
  const { error } = await supabaseAdmin().from("items").update(p).eq("id", id);
  if (error) throw error;
  return getItem(id);
}

export async function deleteItem(id: string): Promise<void> {
  await supabaseAdmin().from("items").delete().eq("id", id);
}

/* ---------------- emergency requests ---------------- */

/** drop rows authored by suspended members (rows with no created_by stay; fail-safe keeps all) */
function withoutSuspendedAuthors<T extends { created_by?: string }>(
  rows: T[],
  suspendedIds: string[],
): T[] {
  if (!suspendedIds.length) return rows;
  const blocked = new Set(suspendedIds);
  return rows.filter((r) => !r.created_by || !blocked.has(r.created_by));
}

export async function listOpenRequests(): Promise<EmergencyRequest[]> {
  const { data, error } = await supabaseAdmin()
    .from("emergency_requests").select("*")
    .eq("status", "open").order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map(toRequest);
  try {
    return withoutSuspendedAuthors(rows, await getSuspendedIds());
  } catch {
    return rows; // fail-safe: prefer showing over accidentally hiding everything
  }
}

export async function listAllRequests(): Promise<EmergencyRequest[]> {
  const { data, error } = await supabaseAdmin()
    .from("emergency_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRequest);
}

export async function getRequest(id: string): Promise<EmergencyRequest | null> {
  const { data } = await supabaseAdmin().from("emergency_requests").select("*").eq("id", id).maybeSingle();
  return data ? toRequest(data) : null;
}

export async function insertRequest(r: EmergencyRequest): Promise<EmergencyRequest> {
  const { error } = await supabaseAdmin().from("emergency_requests").insert({
    id: r.id, kind: r.kind, urgency: r.urgency, patient_name: r.patient_name ?? null,
    phone: r.phone, alt_phone: r.alt_phone ?? null, hospital: r.hospital ?? null,
    blood_group: r.blood_group ?? null, patient_type: r.patient_type ?? null,
    location: r.location ?? null, detail_location: r.detail_location ?? null,
    needed_at: r.needed_at ?? null, note: r.note ?? null, status: r.status,
    created_by: r.created_by ?? null, created_at: r.created_at,
  });
  if (error) throw error;
  return r;
}

export async function updateRequestStatus(id: string, status: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("emergency_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deactivateRequestBroadcasts(id: string): Promise<void> {
  // requests created broadcasts with source="request" and the request id inside link
  const { error } = await supabaseAdmin()
    .from("broadcasts").update({ active: false })
    .eq("source", "request").eq("link", `/requests/${id}`);
  if (error) throw error;
}

/* ---------------- payments ---------------- */

export async function listPayments(memberId?: string): Promise<PaymentRecord[]> {
  let q = supabaseAdmin().from("payments").select("*");
  if (memberId) q = q.eq("member_id", memberId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPayment);
}

export async function getPaymentByTran(tranId: string): Promise<PaymentRecord | null> {
  const { data } = await supabaseAdmin().from("payments").select("*").eq("tran_id", tranId).maybeSingle();
  return data ? toPayment(data) : null;
}

export async function getPayment(id: string): Promise<PaymentRecord | null> {
  const { data } = await supabaseAdmin().from("payments").select("*").eq("id", id).maybeSingle();
  return data ? toPayment(data) : null;
}

export async function insertPayment(p: PaymentRecord): Promise<PaymentRecord> {
  const { error } = await supabaseAdmin().from("payments").insert({
    id: p.id, tran_id: p.tran_id, member_id: p.member_id, member_name: p.member_name,
    item_id: p.item_id ?? null, item_title: p.item_title, amount: p.amount,
    method: p.method, status: p.status, gateway_ref: p.gateway_ref ?? null,
    sender_number: p.sender_number ?? null,
    gateway_trxid: p.gateway_trxid ?? null, gateway_method: p.gateway_method ?? null,
    note: p.note ?? null,
    source: p.source ?? "gateway", admin_username: p.admin_username ?? null,
    admin_name: p.admin_name ?? null, created_at: p.created_at,
  });
  if (error) throw error;
  return p;
}

export async function updatePayment(id: string, patch: Partial<PaymentRecord>): Promise<void> {
  const p: Record<string, unknown> = { ...patch };
  delete p.id;
  const { error } = await supabaseAdmin().from("payments").update(p).eq("id", id);
  if (error) throw error;
}

/* ---------------- broadcasts ---------------- */

export async function listBroadcasts(activeOnly: boolean): Promise<Broadcast[]> {
  let q = supabaseAdmin().from("broadcasts").select("*");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBroadcast);
}

export async function insertBroadcast(b: Broadcast): Promise<Broadcast> {
  const { error } = await supabaseAdmin().from("broadcasts").insert({
    id: b.id, title: b.title, body: b.body, severity: b.severity, source: b.source,
    active: b.active, link: b.link ?? null, created_at: b.created_at,
  });
  if (error) throw error;
  return b;
}

export async function updateBroadcast(id: string, patch: { active?: boolean }): Promise<void> {
  const { error } = await supabaseAdmin().from("broadcasts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBroadcast(id: string): Promise<void> {
  await supabaseAdmin().from("broadcasts").delete().eq("id", id);
}

/* ---------------- home sections ---------------- */

export async function getHomeSections(): Promise<HomeSectionCfg[]> {
  const { data, error } = await supabaseAdmin()
    .from("home_sections").select("*").order("sort", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    key: r.key, visible: r.visible,
    title: r.title ?? undefined, subtitle: r.subtitle ?? undefined,
  }));
}

export async function putHomeSections(sections: HomeSectionCfg[]): Promise<void> {
  const rows = sections.map((s, i) => ({
    key: s.key, visible: Boolean(s.visible),
    title: s.title ?? null, subtitle: s.subtitle ?? null, sort: i,
  }));
  const { error } = await supabaseAdmin()
    .from("home_sections").upsert(rows, { onConflict: "key" });
  if (error) throw error;
}

/* ---------------- schedule (admin-controlled weekly schedule) ---------------- */

const SCHEDULE_COLS = "id,day,time_text,activity,place,icon,sort,active,created_at";

export function toScheduleRow(r: any): ScheduleRow {
  return {
    id: r.id, day: r.day, time_text: r.time_text, activity: r.activity,
    place: r.place, icon: r.icon, sort: num(r.sort), active: r.active,
    created_at: r.created_at,
  };
}

export async function listSchedule(activeOnly: boolean): Promise<ScheduleRow[]> {
  let q = supabaseAdmin().from("schedule").select(SCHEDULE_COLS);
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toScheduleRow);
}

export async function insertScheduleRow(row: ScheduleRow): Promise<ScheduleRow> {
  const { error } = await supabaseAdmin().from("schedule").insert({
    id: row.id, day: row.day, time_text: row.time_text, activity: row.activity,
    place: row.place, icon: row.icon, sort: row.sort, active: row.active,
    created_at: row.created_at,
  });
  if (error) throw error;
  return row;
}

const SCHEDULE_FIELDS = ["day", "time_text", "activity", "place", "icon", "sort", "active"] as const;

export async function updateScheduleRow(id: string, patch: Record<string, unknown>): Promise<void> {
  const p: Record<string, unknown> = {};
  for (const k of SCHEDULE_FIELDS) if (k in patch) p[k] = patch[k];
  if (!Object.keys(p).length) return;
  const { error } = await supabaseAdmin().from("schedule").update(p).eq("id", id);
  if (error) throw error;
}

export async function deleteScheduleRow(id: string): Promise<void> {
  await supabaseAdmin().from("schedule").delete().eq("id", id);
}

/* ---------------- suspended-member auto-hide helpers ---------------- */

/**
 * ids of suspended members — queried LIVE on every call.
 * (A module-level cache would be unsafe under the edge runtime, where each
 * isolate has its own module state; the query is a cheap indexed select on a
 * small table, so correctness beats caching here.)
 */
export async function getSuspendedIds(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("members").select("id,status").eq("status", "suspended");
    if (error) throw error;
    return (data ?? []).map((r: any) => r.id as string);
  } catch {
    return [];
  }
}

/** no-op kept for API compatibility (cache removed; suspension is live) */
export function invalidateSuspendedCache(): void {}

/* ---------------- contacts ---------------- */

export async function listContacts(activeOnly: boolean): Promise<Contact[]> {
  let q = supabaseAdmin().from("contacts").select("*");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toContact);
}

export async function insertContact(c: Contact): Promise<Contact> {
  const { error } = await supabaseAdmin().from("contacts").insert({
    id: c.id, kind: c.kind, label: c.label, value: c.value, icon: c.icon,
    active: c.active, sort: c.sort, created_at: c.created_at,
  });
  if (error) throw error;
  return c;
}

const CONTACT_FIELDS = ["kind", "label", "value", "icon", "active", "sort"] as const;

export async function updateContact(id: string, patch: Record<string, unknown>): Promise<void> {
  const p: Record<string, unknown> = {};
  for (const k of CONTACT_FIELDS) if (k in patch) p[k] = patch[k];
  if (!Object.keys(p).length) return;
  const { error } = await supabaseAdmin().from("contacts").update(p).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  await supabaseAdmin().from("contacts").delete().eq("id", id);
}
