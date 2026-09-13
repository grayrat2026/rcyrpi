import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, uid, dbNow, insertMember, memberFieldTaken } from "@/lib/store";
import { setSessionCookie, toSessionUser } from "@/lib/session";
import { findDistrict } from "@/data/geo";

export const runtime = "edge";


const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_.]+$/),
  full_name: z.string().min(3).max(80),
  email: z.string().email(),
  phone: z.string().min(10),
  alt_phone: z.string().optional(),
  password: z.string().min(6).max(64),
  avatar_url: z.string().optional(),
  blood_group: z.string().optional(),
  address: z.object({
    district: z.string(),
    upazila: z.string(),
    thana: z.string(),
    ward: z.string(),
    para: z.string(),
  }),
  agree_terms: z.literal(true),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code })) },
      { status: 400 }
    );
  }
  if (!findDistrict(parsed.data.address.district)) {
    return NextResponse.json({ error: "invalid_district" }, { status: 400 });
  }
  try {
    if (await memberFieldTaken("username", parsed.data.username)) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }
    if (await memberFieldTaken("email", parsed.data.email)) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    if (await memberFieldTaken("phone", parsed.data.phone)) {
      return NextResponse.json({ error: "phone_taken" }, { status: 409 });
    }
    const member = {
      id: uid("m"),
      username: parsed.data.username,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      alt_phone: parsed.data.alt_phone || undefined,
      password_hash: await hashPassword(parsed.data.password),
      role: "member" as const,
      avatar_url: parsed.data.avatar_url,
      blood_group: parsed.data.blood_group,
      address: parsed.data.address,
      status: "active" as const,
      created_at: dbNow(),
    };
    await insertMember(member);
    await setSessionCookie(member.id, member.role);
    return NextResponse.json({ user: toSessionUser(member) }, { status: 201 });
  } catch (e) {
    console.error("signup error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
