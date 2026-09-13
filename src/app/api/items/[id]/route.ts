import { NextResponse } from "next/server";
import { getItem, updateItem, deleteItem } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


/** Public: single item (used by shareable payment links /pay/{id}) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const item = await getItem(id);
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("item GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  try {
    // protected fields
    delete body.id; delete body.created_by; delete body.created_at;
    const item = await updateItem(id, body);
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("item PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("item DELETE error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
