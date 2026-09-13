import { NextResponse } from "next/server";
import { z } from "zod";
import { getMemberById, updateMember, hashPassword } from "@/lib/store";
import { requireUser } from "@/lib/session";

export const runtime = "edge";


const schema = z.object({
  current_password: z.string().min(1).max(64),
  new_password: z.string().min(6).max(64),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const me = await getMemberById(user.id);
    if (!me) return NextResponse.json({ error: "login_required" }, { status: 401 });
    if (me.password_hash !== (await hashPassword(parsed.data.current_password))) {
      return NextResponse.json({ error: "wrong_password" }, { status: 400 });
    }
    await updateMember(me.id, { password_hash: await hashPassword(parsed.data.new_password) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("profile password error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
