import { NextResponse } from "next/server";
import { updateBroadcast, deleteBroadcast, listBroadcasts } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


/** Admin: deactivate/reactivate broadcast (stops/starts the popup everywhere) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { active } = await req.json();
  try {
    const all = await listBroadcasts(false);
    if (!all.some((b) => b.id === id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await updateBroadcast(id, { active: Boolean(active) });
    const b = all.find((x) => x.id === id)!;
    return NextResponse.json({ broadcast: { ...b, active: Boolean(active) } });
  } catch (e) {
    console.error("broadcast PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteBroadcast(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("broadcast DELETE error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
