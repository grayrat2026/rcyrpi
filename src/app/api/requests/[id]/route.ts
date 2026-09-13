import { NextResponse } from "next/server";
import { getRequest, updateRequestStatus, deactivateRequestBroadcasts } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  try {
    const r = await getRequest(id);
    if (!r) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!["open", "fulfilled", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "bad_status" }, { status: 400 });
    }
    await updateRequestStatus(id, status);
    if (status !== "open") {
      // deactivate linked broadcast
      await deactivateRequestBroadcasts(id);
    }
    return NextResponse.json({ request: { ...r, status } });
  } catch (e) {
    console.error("request PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
