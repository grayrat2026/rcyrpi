// ============================================================
// Supabase BROWSER client (anon key) — realtime only.
//
// Fail-safe by design: missing env vars or any realtime error
// must NEVER break the page. Callers get null / noop closures.
// anon + RLS only — no service role here, no session persistence
// (we never authenticate with this client; RLS anon policies apply).
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

/** Singleton browser client — null (never throws) when env is missing. */
export function getSupabaseBrowser(): SupabaseClient | null {
  try {
    if (!URL || !ANON) return null;
    if (!browserClient) {
      browserClient = createClient(URL, ANON, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 5 } },
      });
    }
    return browserClient;
  } catch {
    return null;
  }
}

/**
 * Subscribe to INSERT/UPDATE/DELETE on public.broadcasts via
 * Supabase Realtime (postgres_changes). RLS governs what anon sees.
 *
 * Returns an unsubscribe closure; never throws. If realtime is
 * unavailable (missing env, SSR, etc.) returns a noop unsubscribe.
 */
export function subscribeToBroadcasts(onChange: () => void): () => void {
  try {
    const client = getSupabaseBrowser();
    if (!client) return () => {};

    const channel = client
      .channel("broadcasts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broadcasts" },
        () => onChange()
      )
      .subscribe();

    return () => {
      try {
        void client.removeChannel(channel);
      } catch {
        /* noop — cleanup must never throw */
      }
    };
  } catch {
    return () => {};
  }
}
