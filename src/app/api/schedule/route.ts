import { NextResponse } from "next/server";
import { listSchedule, insertScheduleRow, uid, dbNow } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import type { ScheduleDay, ScheduleRow } from "@/lib/types";

export const runtime = "edge";


const DAYS: ScheduleDay[] = ["sat", "sun", "mon", "tue", "wed", "thu"];

/** Public: active rows — Admin: ?scope=all returns inactive rows too */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("scope") === "all") {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    try {
      const rows = await listSchedule(false);
      return NextResponse.json({ schedule: rows });
    } catch (e) {
      console.error("schedule GET error:", e);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  }
  try {
    const rows = await listSchedule(true);
    return NextResponse.json({ schedule: rows });
  } catch (e) {
    console.error("schedule GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin: add a schedule row */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const day = body.day as ScheduleDay;
  if (!DAYS.includes(day) || !body.activity?.en || !body.place?.en) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    const all = await listSchedule(false);
    const row: ScheduleRow = {
      id: uid("sch"),
      day,
      time_text: String(body.time_text ?? "").trim(),
      activity: { en: body.activity.en, bn: body.activity.bn || body.activity.en },
      place: { en: body.place.en, bn: body.place.bn || body.place.en },
      icon: body.icon || "Sparkles",
      sort: typeof body.sort === "number" ? body.sort : all.length,
      active: body.active !== false,
      created_at: dbNow(),
    };
    await insertScheduleRow(row);
    return NextResponse.json({ row }, { status: 201 });
  } catch (e) {
    console.error("schedule POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
