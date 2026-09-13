import { NextResponse } from "next/server";
import { updateScheduleRow, deleteScheduleRow } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


/** Admin: edit a schedule row */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  try {
    // protected fields
    delete body.id;
    delete body.created_at;
    await updateScheduleRow(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("schedule PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin: delete a schedule row */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteScheduleRow(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("schedule DELETE error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
