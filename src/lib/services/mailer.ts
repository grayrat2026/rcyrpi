// ============================================================
// Mailer — password-reset email with site-branded HTML.
//
// SMTP mode (SMTP_HOST/PORT/USER/PASS/FROM set in .env):
//   real delivery via nodemailer.
// FALLBACK (no SMTP configured):
//   sendResetEmail returns { sent: false, previewUrl } so the reset
//   flow still works end-to-end (link shown on-screen) until the
//   SMTP credentials are added.
// ============================================================

export const mailerConfigured = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

/** sha256 of the raw token — only the hash is stored in the DB (Web Crypto, edge-safe) */
export async function hashResetToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** branded bilingual reset email (site theme: red gradient + green accents) */
export function resetEmailHtml(name: string, resetUrl: string, lang: "en" | "bn"): string {
  const copy =
    lang === "bn"
      ? {
          hi: `আসসালামু আলাইকুম ${name},`,
          p1: "আপনার অনুরোধে পাসওয়ার্ড রিসেট লিঙ্ক তৈরি করা হয়েছে। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।",
          btn: "নতুন পাসওয়ার্ড সেট করুন",
          p2: "লিঙ্কটি ৩০ মিনিটের জন্য কার্যকর। আপনি নিজে অনুরোধ করেননি? তাহলে এই ইমেইল উপেক্ষা করুন — আপনার পাসওয়ার্ড অপরিবর্তিত থাকবে।",
          foot: "যুব রেড ক্রিসেন্ট দল — রংপুর সরকারি পলিটেকনিক ইনস্টিটিউট",
        }
      : {
          hi: `Hello ${name},`,
          p1: "We received a request to reset your password. Click the button below to set a new password.",
          btn: "Set a new password",
          p2: "This link is valid for 30 minutes. Didn't request it? Just ignore this email — your password stays unchanged.",
          foot: "Youth Red Crescent Team — Rangpur Govt. Polytechnic Institute",
        };
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(90deg,#e30613,#00a651);border-radius:16px 16px 0 0;height:8px;"></div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,.06);padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:20px;font-weight:800;color:#e30613;">Youth <span style="color:#e30613;">Red Crescent</span> <span style="color:#00a651;">Team</span></p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Rangpur Govt. Polytechnic Institute</p>
      </div>
      <p style="margin:0 0 12px;font-size:15px;color:#111827;font-weight:bold;">${copy.hi}</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">${copy.p1}</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(90deg,#e30613,#00a651);color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">${copy.btn}</a>
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:#6b7280;word-break:break-all;">${resetUrl}</p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#4b5563;">${copy.p2}</p>
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">${copy.foot}</p>
      </div>
    </div>
  </div>
</body></html>`;
}

export interface ResetEmailResult {
  sent: boolean;
  previewUrl?: string; // only when SMTP not configured
  error?: string;
}

/** send the reset email; falls back to previewUrl when SMTP is not configured */
export async function sendResetEmail(
  to: string,
  name: string,
  resetUrl: string,
  lang: "en" | "bn" = "en"
): Promise<ResetEmailResult> {
  if (!mailerConfigured()) {
    // Fallback — surface the link in the API response so the flow is testable
    return { sent: false, previewUrl: resetUrl };
  }
  try {
    // webpackIgnore/turbopackIgnore: nodemailer needs Node net/tls — do NOT
    // bundle into edge/serverless builds; resolve natively at runtime when
    // SMTP is actually configured (on edge, import fails -> caught -> fallback).
    const nodemailer = await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ "nodemailer"
    ).catch(() => null);
    if (!nodemailer) {
      console.error("nodemailer unavailable in this runtime; using fallback link");
      return { sent: false, previewUrl: resetUrl, error: "smtp_unavailable" };
    }
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject:
        lang === "bn"
          ? "পাসওয়ার্ড রিসেট — যুব রেড ক্রিসেন্ট দল"
          : "Password Reset — Youth Red Crescent Team",
      html: resetEmailHtml(name, resetUrl, lang),
    });
    return { sent: true };
  } catch (e) {
    console.error("sendResetEmail error:", e instanceof Error ? e.message : e);
    return { sent: false, previewUrl: resetUrl, error: "smtp_error" };
  }
}
