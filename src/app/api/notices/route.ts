import { NextResponse } from "next/server";
import { listNotices, insertNotice, updateNotice, deleteNotice, uid, dbNow, insertBroadcast } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import type { Notice } from "@/lib/types";

export const runtime = "edge";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  try {
    const notices = await listNotices(category);
    return NextResponse.json({ notices });
  } catch (e) {
    console.error("notices GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  try {
    const notice: Notice = {
      id: uid("n"),
      title: body.title, body: body.body,
      category: body.category ?? "general",
      severity: body.severity ?? "low",
      is_pinned: Boolean(body.is_pinned),
      show_popup: Boolean(body.show_popup),
      created_by: admin.id,
      created_at: dbNow(),
      expires_at: body.expires_at || undefined,
    };
    await insertNotice(notice);
    // urgent notices with popup also become broadcasts so every page pops them
    if (notice.show_popup && (notice.severity === "critical" || notice.severity === "high")) {
      await insertBroadcast({
        id: uid("bc"),
        title: notice.title, body: notice.body,
        severity: notice.severity === "critical" ? "critical" : "high",
        source: "admin", active: true, link: "/notices", created_at: dbNow(),
      });
    }
    return NextResponse.json({ notice }, { status: 201 });
  } catch (e) {
    console.error("notices POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
