// ============================================================
// Supabase client — READY but INACTIVE (mock mode by default)
//
// Secrets to store (Supabase Edge Secrets / .env / Vercel env):
//   NEXT_PUBLIC_SUPABASE_URL   <- your project url
//   SUPABASE_ANON_KEY          <- anon (public) key
//   SUPABASE_SERVICE_ROLE_KEY  <- server-only secret (NEVER expose)
//   PAYMENT_BASE_URL           <- https://pay.invokeil.cfd/api
//   PAYMENT_RUSER_API          <- gateway checkout key
//   PAYMENT_ADMIN_API          <- gateway verify/refund key
//   SESSION_SECRET             <- random string for cookie signing
//
// When env vars are set, flip services to use supabaseFrom() below.
// Full guide: docs/INTEGRATION.md
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseEnabled = () => Boolean(URL && ANON);

let adminClient: SupabaseClient | null = null;

/** server-side client (service role) */
export function supabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    if (!URL || !SERVICE) throw new Error("Supabase env missing");
    adminClient = createClient(URL, SERVICE, { auth: { persistSession: false } });
  }
  return adminClient;
}
