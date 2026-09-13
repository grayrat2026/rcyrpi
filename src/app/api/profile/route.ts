import { NextResponse } from "next/server";
import { z } from "zod";
import { getMemberById, updateMember, memberFieldTaken } from "@/lib/store";
import { requireUser, toSessionUser } from "@/lib/session";
import type { Member } from "@/lib/types";

export const runtime = "edge";


/** sanitized member (never leaks password_hash) */
function sanitize(m: Member) {
  const { password_hash: _drop, ...profile } = m;
  void _drop;
  return { ...profile, session: toSessionUser(m) };
}

const schema = z.object({
  full_name: z.string().min(3).max(80),
  email: z.string().email(),
  phone: z.string().min(10),
  alt_phone: z.string().max(20).optional().nullable(),
  blood_group: z.string().max(5).optional().nullable(),
  avatar_url: z.string().max(500_000).optional().nullable(),
  address: z.object({
    district: z.string().min(2),
    upazila: z.string().min(2),
    thana: z.string().min(2),
    ward: z.string().max(40),
    para: z.string().max(120),
  }),
  upazila_unit: z.string().max(80).optional().nullable(),
  // admin-only organisational fields (ignored for regular users)
  team: z.string().max(80).optional().nullable(),
  sub_team: z.string().max(80).optional().nullable(),
  member_no: z.string().max(40).optional().nullable(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  try {
    const member = await getMemberById(user.id);
    if (!member) return NextResponse.json({ error: "login_required" }, { status: 401 });
    return NextResponse.json({ profile: sanitize(member) });
  } catch (e) {
    console.error("profile GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code })) },
      { status: 400 }
    );
  }
  try {
    const me = await getMemberById(user.id);
    if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });

    // username is immutable — silently ignored even if sent

    if (await memberFieldTaken("email", parsed.data.email, me.id)) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    if (await memberFieldTaken("phone", parsed.data.phone, me.id)) {
      return NextResponse.json({ error: "phone_taken" }, { status: 409 });
    }

    const d = parsed.data;
    const patch: Partial<Member> = {
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      alt_phone: d.alt_phone || undefined,
      blood_group: d.blood_group || undefined,
      avatar_url: d.avatar_url === "" ? undefined : d.avatar_url || me.avatar_url,
      address: d.address,
      upazila_unit: d.upazila_unit || undefined,
    };
    // organisational fields — admins only
    if (me.role === "admin") {
      patch.team = d.team || undefined;
      patch.sub_team = d.sub_team || undefined;
      patch.member_no = d.member_no || undefined;
    }
    await updateMember(me.id, patch);
    const updated = await getMemberById(me.id);
    return NextResponse.json({ profile: sanitize(updated!) });
  } catch (e) {
    console.error("profile PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
