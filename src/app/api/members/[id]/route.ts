import { NextResponse } from "next/server";
import { getMemberById, updateMember, invalidateSuspendedCache } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


/** Admin: suspend / activate a member (cannot suspend self) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  try {
    const m = await getMemberById(id);
    if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (m.id === admin.id) {
      return NextResponse.json({ error: "cannot_suspend_self" }, { status: 400 });
    }
    if (!["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "bad_status" }, { status: 400 });
    }
    await updateMember(id, { status });
    // suspended members' content hides from the public site instantly
    invalidateSuspendedCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("member PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
