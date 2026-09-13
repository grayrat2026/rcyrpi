// ============================================================
// Session helpers — HMAC-signed httpOnly cookie.
// Swap with Supabase Auth later (same interface).
// ============================================================

import { cookies } from "next/headers";
import { getMemberById } from "@/lib/store";
import type { Member, SessionUser } from "@/lib/types";

const COOKIE = "rcy_session";
const SECRET = process.env.SESSION_SECRET || "rcy-dev-secret-change-me";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const enc = new TextEncoder();

interface SessionPayload {
  id: string;
  role: string;
  exp: number;
}

/** HMAC-SHA256 via Web Crypto — works on Node AND edge runtimes */
async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function createToken(id: string, role: string): Promise<string> {
  const payload: SessionPayload = { id, role, exp: Date.now() + MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${await sign(body)}`;
}

export async function verifyToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if ((await sign(body)) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function toSessionUser(m: Member): SessionUser {
  return {
    id: m.id, username: m.username, full_name: m.full_name, role: m.role,
    avatar_url: m.avatar_url, blood_group: m.blood_group, phone: m.phone,
    email: m.email, address: m.address,
  };
}

/** server-side current user from cookie */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const payload = await verifyToken(store.get(COOKIE)?.value);
  if (!payload) return null;
  try {
    const member = await getMemberById(payload.id);
    return member && member.status === "active" ? toSessionUser(member) : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(id: string, role: string) {
  const store = await cookies();
  store.set(COOKIE, await createToken(id, role), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** API guard helpers */
export async function requireAdmin(): Promise<SessionUser | null> {
  const u = await getSessionUser();
  return u?.role === "admin" ? u : null;
}

export async function requireUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
