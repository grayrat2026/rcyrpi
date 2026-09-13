import { NextResponse } from "next/server";
import { listItems, insertItem, uid, dbNow } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import type { Item } from "@/lib/types";

export const runtime = "edge";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  try {
    const items = await listItems(kind);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("items GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const item: Item = {
      id: uid("i"),
      kind: body.kind ?? "event",
      title: body.title,
      description: body.description ?? { en: "", bn: "" },
      icon: body.icon ?? "CalendarDays",
      amount: Number(body.amount) || 0,
      payment_required: Boolean(body.payment_required),
      deadline: body.deadline || undefined,
      event_date: body.event_date || undefined,
      location: body.location || undefined,
      map_link: body.map_link || undefined,
      status: "active",
      volunteer_hours: Math.max(0, Math.floor(Number(body.volunteer_hours) || 0)),
      created_by: admin.id,
      created_at: dbNow(),
    };
    await insertItem(item);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error("items POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
