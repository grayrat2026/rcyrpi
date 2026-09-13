// ============================================================
// Gateway config — resolves PipraPay credentials LIVE.
//
// Priority:
//   1. .env PAYMENT_BASE_URL / PAYMENT_RUSER_API / PAYMENT_ADMIN_API
//   2. Supabase `app_config` table (payment_base_url, payment_ruser_api,
//      payment_admin_api) — read with the service-role key, cached 60s.
//      Update the rows in the Supabase SQL editor and the gateway
//      reconfigures itself within 60s, no redeploy needed.
//   3. Supabase Secrets Manager (same names) — via Management API.
//
// base_url must be a valid http(s) URL (older digest-only values fail
// validation and the site safely falls back to the internal themed
// checkout until raw keys are set).
// ============================================================

import { supabaseAdmin } from "@/lib/supabase/client";

export interface GatewayConfig {
  base_url: string; // e.g. https://pay.example.com/api
  ruser_key: string;
  admin_key: string;
}

let cache: { cfg: GatewayConfig | null; at: number } | null = null;
const TTL = 60_000;

const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

function fromEnv(): GatewayConfig | null {
  const base_url = process.env.PAYMENT_BASE_URL;
  const ruser_key = process.env.PAYMENT_RUSER_API;
  const admin_key = process.env.PAYMENT_ADMIN_API;
  if (base_url && ruser_key && admin_key && isHttpUrl(base_url)) {
    return { base_url: base_url.replace(/\/$/, ""), ruser_key, admin_key };
  }
  return null;
}

/** Supabase app_config table (service-role read; live updatable) */
async function fromAppConfigTable(): Promise<GatewayConfig | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("app_config")
      .select("key,value")
      .in("key", ["payment_base_url", "payment_ruser_api", "payment_admin_api"]);
    if (error || !data || data.length < 3) return null;
    const get = (k: string) =>
      data.find((r: { key: string }) => r.key === k)?.value?.trim() ?? "";
    const base_url = get("payment_base_url");
    const ruser_key = get("payment_ruser_api");
    const admin_key = get("payment_admin_api");
    if (base_url && ruser_key && admin_key && isHttpUrl(base_url)) {
      return { base_url: base_url.replace(/\/$/, ""), ruser_key, admin_key };
    }
    return null;
  } catch {
    return null;
  }
}

async function fromSupabaseSecrets(): Promise<GatewayConfig | null> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!token || !ref) return null;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { name: string; value?: string }[];
    const get = (n: string) => rows.find((r) => r.name === n)?.value?.trim() ?? "";
    const base_url = get("payment_base_url");
    const ruser_key = get("payment_ruser_api");
    const admin_key = get("payment_admin_api");
    if (base_url && ruser_key && admin_key && isHttpUrl(base_url)) {
      return { base_url: base_url.replace(/\/$/, ""), ruser_key, admin_key };
    }
    return null;
  } catch {
    return null;
  }
}

/** resolved gateway config, or null when not configured (fallback checkout) */
export async function getGatewayConfig(): Promise<GatewayConfig | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.cfg;
  let cfg = fromEnv();
  if (!cfg) cfg = await fromAppConfigTable();
  if (!cfg) cfg = await fromSupabaseSecrets();
  cache = { cfg, at: Date.now() };
  return cfg;
}

/** force re-read on the next call (e.g. after a failed charge) */
export function invalidateGatewayConfig(): void {
  cache = null;
}
