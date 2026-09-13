import { NextResponse } from "next/server";
import { getPayment, updatePayment } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import { gatewayRefund } from "@/lib/services/payments";

export const runtime = "edge";


/** Admin manual verify / reject of a payment record */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action, note } = await req.json(); // action: verify | reject
  try {
    const p = await getPayment(id);
    if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (action === "verify") {
      const patch = {
        status: "success" as const,
        verified_at: new Date().toISOString(),
        verified_by: `admin:${admin.username}`,
      };
      await updatePayment(id, patch);
      return NextResponse.json({ payment: { ...p, ...patch } });
    }
    if (action === "reject") {
      const patch = { status: "failed" as const, note: note || "Rejected by admin" };
      await updatePayment(id, patch);
      return NextResponse.json({ payment: { ...p, ...patch } });
    }
    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  } catch (e) {
    console.error("payment PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin refund */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const p = await getPayment(id);
    if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { refunded } = await gatewayRefund(p.tran_id, p.amount);
    const patch = {
      status: "refunded" as const,
      note: `Refunded by ${admin.username} (gateway: ${refunded ? "ok" : "manual"})`,
    };
    await updatePayment(id, patch);
    return NextResponse.json({ payment: { ...p, ...patch } });
  } catch (e) {
    console.error("payment refund error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
