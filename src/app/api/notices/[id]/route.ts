import { NextResponse } from "next/server";
import { updateNotice, deleteNotice } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  try {
    const notice = await updateNotice(id, body);
    if (!notice) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ notice });
  } catch (e) {
    console.error("notice PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteNotice(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notice DELETE error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
