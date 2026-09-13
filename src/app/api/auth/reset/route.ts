import { NextResponse } from "next/server";
import { supabaseAdmin, getMemberById, updateMember, hashPassword } from "@/lib/store";
import { hashResetToken } from "@/lib/services/mailer";

export const runtime = "edge";


/**
 * POST /api/auth/reset { token, password }
 * Validates the one-time token (hash match, unused, unexpired),
 * updates the password, burns the token.
 */
export async function POST(req: Request) {
  const { token, password } = await req.json();
  const t = String(token ?? "").trim();
  const pw = String(password ?? "");
  if (!t) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  if (pw.length < 6) return NextResponse.json({ error: "pw_short" }, { status: 400 });
  try {
    const { data: row, error } = await supabaseAdmin()
      .from("password_resets")
      .select("id,member_id,expires_at,used")
      .eq("token_hash", await hashResetToken(t))
      .maybeSingle();
    if (error) throw error;
    if (!row || row.used || new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    const member = await getMemberById(row.member_id);
    if (!member) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    await updateMember(member.id, { password_hash: await hashPassword(pw) });
    await supabaseAdmin().from("password_resets").update({ used: true }).eq("id", row.id);
    // burn any other outstanding tokens for this member
    await supabaseAdmin()
      .from("password_resets")
      .update({ used: true })
      .eq("member_id", member.id)
      .eq("used", false);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("auth reset error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
