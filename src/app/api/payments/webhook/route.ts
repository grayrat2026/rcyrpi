import { NextResponse } from "next/server";
import { getPaymentByTran, updatePayment, dbNow } from "@/lib/store";
import { gatewayVerify } from "@/lib/services/payments";

export const runtime = "edge";


/**
 * PipraPay webhook — gateway notifies us when a charge completes.
 * Body: { metadata: { tran_id }, pp_id, status, ... } (shape may vary)
 * Security: we NEVER trust the payload — every notification is
 * re-verified against the gateway with the ADMIN key before the
 * payment is marked successful.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const meta = (body.metadata ?? {}) as Record<string, unknown>;
    const tranId = String(
      body.tran_id ?? meta.tran_id ?? body.tranId ?? ""
    ).trim();
    if (!tranId) return NextResponse.json({ ok: false }, { status: 400 });

    const record = await getPaymentByTran(tranId);
    if (!record || record.status === "success") {
      return NextResponse.json({ ok: true });
    }
    const ppId = String(body.pp_id ?? body.id ?? record.gateway_ref ?? "");
    const { verified, trxid, method: gwMethod, sender } = await gatewayVerify(
      tranId,
      ppId || undefined
    );
    if (verified) {
      await updatePayment(record.id, {
        status: "success",
        method: "gateway",
        gateway_ref: ppId || record.gateway_ref,
        gateway_trxid: trxid ?? record.gateway_trxid,
        gateway_method: gwMethod ?? record.gateway_method,
        sender_number: sender ?? record.sender_number,
        verified_at: dbNow(),
        verified_by: "system:webhook",
      });
    }
    return NextResponse.json({ ok: true, verified });
  } catch (e) {
    console.error("payments webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
