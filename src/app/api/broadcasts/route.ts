import { NextResponse } from "next/server";
import { listBroadcasts, insertBroadcast, uid, dbNow } from "@/lib/store";
import { requireAdmin, getSessionUser } from "@/lib/session";
import type { Broadcast } from "@/lib/types";

export const runtime = "edge";


export async function GET() {
  try {
    const user = await getSessionUser();
    if (user?.role === "admin") {
      return NextResponse.json({ broadcasts: await listBroadcasts(false) });
    }
    return NextResponse.json({ broadcasts: await listBroadcasts(true) });
  } catch (e) {
    console.error("broadcasts GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin: push emergency broadcast -> global popup on every visitor */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const b: Broadcast = {
      id: uid("bc"),
      title: body.title,
      body: body.body,
      severity: body.severity === "critical" ? "critical" : "high",
      source: "admin",
      active: true,
      link: "/notices",
      created_at: dbNow(),
    };
    await insertBroadcast(b);
    return NextResponse.json({ broadcast: b }, { status: 201 });
  } catch (e) {
    console.error("broadcasts POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
