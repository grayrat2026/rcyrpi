import { NextResponse } from "next/server";
import { getPaymentByTran, updatePayment, dbNow } from "@/lib/store";
import { requireUser } from "@/lib/session";
import { gatewayVerify } from "@/lib/services/payments";

export const runtime = "edge";


/**
 * Verifies a transaction.
 * FALLBACK MODE (gateway keys not configured): client checkout page posts
 * { tran_id, mock: "success" | "fail" } — auto-verifies locally.
 * REAL MODE: gateway success_url lands here via { tran_id } and we call
 *            {PAYMENT_BASE_URL}/verify-payment with PAYMENT_ADMIN_API.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const { tran_id, mock } = await req.json();
  try {
    const record = await getPaymentByTran(tran_id);
    if (!record) {
      return NextResponse.json({ error: "tran_not_found" }, { status: 404 });
    }
    if (record.status === "success") {
      return NextResponse.json({ payment: record, verified: true });
    }
    const { verified, trxid, method: gwMethod, sender } = mock
      ? { verified: mock === "success" }
      : await gatewayVerify(tran_id, record.gateway_ref);

    const method = mock ? "demo" : "gateway";
    const status = verified ? "success" : "failed";
    if (verified) {
      await updatePayment(record.id, {
        method, status,
        gateway_trxid: trxid ?? record.gateway_trxid,
        gateway_method: gwMethod ?? record.gateway_method,
        sender_number: sender ?? record.sender_number,
        verified_at: dbNow(),
        verified_by: "system:gateway",
      });
    } else {
      await updatePayment(record.id, {
        method, status,
        note: "Payment failed / cancelled at gateway",
      });
    }
    return NextResponse.json({ payment: { ...record, method, status }, verified });
  } catch (e) {
    console.error("payments verify error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
