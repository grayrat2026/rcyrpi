import { NextResponse } from "next/server";
import { findMemberByLogin, supabaseAdmin, dbNow } from "@/lib/store";
import { hashResetToken, newResetToken, sendResetEmail } from "@/lib/services/mailer";

export const runtime = "edge";


/**
 * POST /api/auth/forgot { email }
 * Always returns ok:true (no account enumeration).
 * Creates a one-time token (hashed in DB, 30 min expiry) and emails
 * the branded reset link. When SMTP is not configured the response
 * includes reset_url so the flow still works end-to-end.
 */
export async function POST(req: Request) {
  const { email, lang } = await req.json();
  const addr = String(email ?? "").trim().toLowerCase();
  if (!addr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  try {
    const member = await findMemberByLogin(addr);
    const okResponse = NextResponse.json({ ok: true });
    if (!member || member.status !== "active") {
      // unknown / suspended — respond the same way, do nothing
      return okResponse;
    }

    const token = newResetToken();
    const { error } = await supabaseAdmin().from("password_resets").insert({
      id: `pr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      member_id: member.id,
      token_hash: await hashResetToken(token),
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      used: false,
      created_at: dbNow(),
    });
    if (error) throw error;

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;
    const result = await sendResetEmail(
      member.email,
      member.full_name,
      resetUrl,
      lang === "bn" ? "bn" : "en"
    );
    if (result.sent) return okResponse;
    // SMTP not configured (or failed) — include the link so the flow works
    return NextResponse.json({ ok: true, reset_url: result.previewUrl });
  } catch (e) {
    console.error("auth forgot error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
