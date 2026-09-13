import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/store";

export const runtime = "edge";


/**
 * Public home-page stats — REAL data from the database:
 *   active_members   = members with status active
 *   events_completed = items kind=event with status completed
 *   blood_bags       = SUM(units) of fulfilled blood requests
 *   volunteer_hours  = SUM(volunteer_hours) of completed events
 */
export async function GET() {
  try {
    const [membersRes, eventsRes, bloodRes] = await Promise.all([
      supabaseAdmin().from("members").select("id,status"),
      supabaseAdmin()
        .from("items")
        .select("id,status,volunteer_hours")
        .eq("kind", "event")
        .eq("status", "completed"),
      supabaseAdmin()
        .from("emergency_requests")
        .select("units")
        .eq("kind", "blood")
        .eq("status", "fulfilled"),
    ]);
    const members = membersRes.data ?? [];
    const events = eventsRes.data ?? [];
    const blood = bloodRes.data ?? [];
    const stats = {
      active_members: members.filter((m: any) => m.status === "active").length,
      events_completed: events.length,
      blood_bags: blood.reduce((s: number, r: any) => s + Number(r.units ?? 1), 0),
      volunteer_hours: events.reduce(
        (s: number, r: any) => s + Number(r.volunteer_hours ?? 0),
        0
      ),
    };
    return NextResponse.json(
      { stats },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("public-stats error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
