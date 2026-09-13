import { NextResponse } from "next/server";
import { getItem, getPaymentByTran, insertPayment, uid, dbNow } from "@/lib/store";
import { requireUser } from "@/lib/session";
import type { PaymentRecord } from "@/lib/types";

export const runtime = "edge";


/**
 * Called right after /api/payments/checkout — creates the pending
 * payment record tied to the transaction so verify can find it.
 */
export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const { tran_id, item_id } = await req.json();
  try {
    if (await getPaymentByTran(tran_id)) {
      return NextResponse.json({ ok: true }); // idempotent
    }
    const item = await getItem(item_id);
    if (!item) return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    const record: PaymentRecord = {
      id: uid("p"),
      tran_id,
      member_id: user.id,
      member_name: user.full_name,
      item_id: item.id,
      item_title: item.title,
      amount: item.amount,
      method: "pending",
      status: "pending",
      created_at: dbNow(),
    };
    await insertPayment(record);
    return NextResponse.json({ payment: record }, { status: 201 });
  } catch (e) {
    console.error("payments pending error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
