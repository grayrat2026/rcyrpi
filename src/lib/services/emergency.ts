// ============================================================
// Emergency service
// Merges 3 sources into one alert feed:
//   1. Admin broadcasts (manual)
//   2. Auto-detected earthquakes — USGS public API (no key)
//      geo-fenced around Rangpur (700km radius, M4.5+)
//   3. Auto flood monitor — Open-Meteo river discharge API
//      for Brahmaputra/Dharla corridor (Kurigram gauge)
//      + open critical blood/accident requests
// All external fetches fail-safe: on network error -> silently skip.
// ============================================================

import { supabaseAdmin, toRequest, toNotice, toBroadcast, getSuspendedIds } from "@/lib/store";
import { RANGPUR_CENTER } from "@/data/geo";
import type { FeedAlert } from "@/lib/types";

const QUAKES_URL = (hours: number, minMag: number) =>
  `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${new Date(
    Date.now() - hours * 3600_000
  ).toISOString()}&minmagnitude=${minMag}&latitude=${RANGPUR_CENTER.lat}&longitude=${RANGPUR_CENTER.lng}&maxradiuskm=${RANGPUR_CENTER.radiusKm}&orderby=time`;

const FLOOD_URL =
  `https://api.open-meteo.com/v1/flood?latitude=25.81&longitude=89.13` +
  `&daily=river_discharge&forecast_days=3&past_days=2`;

async function fetchJSON<T>(url: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function detectQuakes(): Promise<FeedAlert[]> {
  const data = await fetchJSON<{ features: Array<{ properties: { mag: number | null; place: string | null; time: number }; id: string }> }>(QUAKES_URL(24, 4.5));
  if (!data?.features?.length) return [];
  return data.features.slice(0, 3).map((f) => {
    const mag = f.properties.mag ?? 4.5;
    const place = f.properties.place ?? "Unknown region";
    return {
      id: `quake-${f.id}`,
      severity: mag >= 5.5 ? "critical" : "high",
      source: "auto:earthquake" as const,
      title: {
        en: `Earthquake detected — M${mag.toFixed(1)} near ${place}`,
        bn: `ভূমিকম্প অনুভূত — M${mag.toFixed(1)}, ${place}`,
      },
      body: {
        en: "Stay alert, avoid weak buildings, keep emergency kits ready. Volunteers: check the unit group for assembly info.",
        bn: "সতর্ক থাকুন, দুর্বল ভবন এড়িয়ে চলুন, ইমার্জেন্সি কিট হাতের কাছে রাখুন। স্বেচ্ছাসেবীরা: ইউনিট গ্রুপে সমাবেশের তথ্য দেখুন।",
      },
      created_at: new Date(f.properties.time).toISOString(),
    };
  });
}

interface FloodData {
  daily?: { river_discharge?: (number | null)[] };
}

async function detectFlood(): Promise<FeedAlert[]> {
  const data = await fetchJSON<FloodData>(FLOOD_URL, 1800);
  const series = data?.daily?.river_discharge;
  if (!series || series.length < 3) return [];
  const past = series.slice(0, 2).filter((v): v is number => typeof v === "number");
  const future = series.slice(2).filter((v): v is number => typeof v === "number");
  if (!past.length || !future.length) return [];
  const base = past.reduce((a, b) => a + b, 0) / past.length;
  const peak = Math.max(...future);
  // heuristic: sharp river rise near Kurigram = flood risk for Rangpur corridor
  if (peak > base * 1.8 && peak > 2000) {
    return [
      {
        id: "flood-monitor",
        severity: "high",
        source: "auto:flood" as const,
        title: {
          en: "Flood risk rising — Brahmaputra corridor",
          bn: "বন্যার ঝুঁকি বাড়ছে — ব্রহ্মপুত্র অববাহিকা",
        },
        body: {
          en: "River discharge is rising sharply near Kurigram. Char-area families, stay ready. Relief volunteers: contact unit secretary.",
          bn: "কুড়িগ্রামের কাছে নদীর পানি দ্রুত বাড়ছে। চরাঞ্চলের পরিবারেরা প্রস্তুত থাকুন। ত্রাণ স্বেচ্ছাসেবীরা: ইউনিট সেক্রেটারির সাথে যোগাযোগ করুন।",
        },
        created_at: new Date().toISOString(),
      },
    ];
  }
  return [];
}

async function requestAlerts(): Promise<FeedAlert[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("emergency_requests").select("*")
      .eq("status", "open").eq("urgency", "immediate")
      .order("created_at", { ascending: false }).limit(10);
    if (error) return [];
    let requests = (data ?? []).map(toRequest);
    // suspended members' requests vanish from the public feed (fail-safe: keep on error)
    try {
      const suspended = new Set(await getSuspendedIds());
      if (suspended.size) {
        requests = requests.filter((r) => !r.created_by || !suspended.has(r.created_by));
      }
    } catch {
      /* keep unfiltered */
    }
    return requests.map((r) => ({
      id: `req-${r.id}`,
      severity: "critical" as const,
      source: "request" as const,
      title: {
        en: `EMERGENCY ${r.kind === "blood" ? `blood needed (${r.blood_group ?? "?"})` : r.kind} — ${r.location ?? ""}`,
        bn: `ইমার্জেন্সি ${r.kind === "blood" ? `রক্ত প্রয়োজন (${r.blood_group ?? "?"})` : r.kind === "accident" ? "দুর্ঘটনা" : "সাহায্য"} — ${r.location ?? ""}`,
      },
      body: {
        en: `${r.hospital ?? r.detail_location ?? ""} Contact: ${r.phone}. Volunteers please respond fast.`,
        bn: `${r.hospital ?? r.detail_location ?? ""} যোগাযোগ: ${r.phone}। স্বেচ্ছাসেবীরা দ্রুত সাড়া দিন।`,
      },
      link: "/notices",
      created_at: r.created_at,
    }));
  } catch {
    return [];
  }
}

async function broadcastAlerts(): Promise<FeedAlert[]> {
  const now = new Date().toISOString();
  try {
    const [bcRes, ntRes] = await Promise.all([
      supabaseAdmin().from("broadcasts").select("*").eq("active", true).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin().from("notices").select("*")
        .in("severity", ["critical", "high"]).eq("show_popup", true)
        .order("created_at", { ascending: false }).limit(20),
    ]);
    const fromNotices: FeedAlert[] = (ntRes.data ?? []).map(toNotice)
      .filter((n) => !n.expires_at || n.expires_at > now)
      .map((n) => ({
        id: `nt-${n.id}`,
        severity: n.severity === "critical" ? ("critical" as const) : ("high" as const),
        source: "admin" as const,
        title: n.title,
        body: n.body,
        link: "/notices",
        created_at: n.created_at,
      }));
    let broadcasts = (bcRes.data ?? []).map(toBroadcast).filter((b) => b.active);

    // request-sourced broadcasts echo member-authored emergency requests (link = /requests/{id}):
    // hide the ones whose author is now suspended — admin/auto broadcasts stay untouched.
    try {
      const reqIds = broadcasts
        .filter((b) => b.source === "request" && b.link?.startsWith("/requests/"))
        .map((b) => (b.link ?? "").slice("/requests/".length))
        .filter(Boolean);
      if (reqIds.length) {
        const [reqRes, suspendedIds] = await Promise.all([
          supabaseAdmin().from("emergency_requests").select("id,created_by").in("id", reqIds),
          getSuspendedIds(),
        ]);
        const suspended = new Set(suspendedIds);
        const rows = (reqRes.data ?? []) as Array<{ id: string; created_by: string | null }>;
        if (!reqRes.error && suspended.size) {
          const hiddenRequests = new Set(
            rows.filter((r) => r.created_by && suspended.has(r.created_by)).map((r) => r.id),
          );
          broadcasts = broadcasts.filter((b) => {
            if (b.source !== "request" || !b.link?.startsWith("/requests/")) return true;
            return !hiddenRequests.has((b.link ?? "").slice("/requests/".length));
          });
        }
      }
    } catch {
      /* fail-safe: keep alerts rather than hide everything */
    }

    const fromBroadcasts: FeedAlert[] = broadcasts.map((b) => ({
      id: `bc-${b.id}`,
      severity: b.severity,
      source: b.source,
      title: b.title,
      body: b.body,
      link: "/notices",
      created_at: b.created_at,
    }));
    return [...fromBroadcasts, ...fromNotices];
  } catch {
    return [];
  }
}

export async function getEmergencyFeed(): Promise<FeedAlert[]> {
  const [quakes, flood, broadcasts, requests] = await Promise.all([
    detectQuakes(), detectFlood(), broadcastAlerts(), requestAlerts(),
  ]);
  const all = [...broadcasts, ...quakes, ...flood, ...requests];
  const rank = { critical: 0, high: 1 } as const;
  return all.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.created_at.localeCompare(a.created_at)
  );
}
