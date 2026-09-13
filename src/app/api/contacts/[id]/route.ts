import { NextResponse } from "next/server";
import { updateContact, deleteContact } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await updateContact(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteContact(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact DELETE error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
