import { NextResponse } from "next/server";
import { getItem } from "@/lib/store";
import { requireUser } from "@/lib/session";
import { gatewayCheckout, newTranId } from "@/lib/services/payments";

export const runtime = "edge";


export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const { item_id } = await req.json();
  try {
    const item = await getItem(item_id);
    if (!item) return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    if (item.status !== "active") {
      return NextResponse.json({ error: "item_not_active" }, { status: 400 });
    }
    if (!item.payment_required || item.amount <= 0) {
      return NextResponse.json({ error: "no_payment_needed" }, { status: 400 });
    }
    const tran_id = newTranId();
    const origin = new URL(req.url).origin;
    const result = await gatewayCheckout({
      tran_id,
      amount: item.amount,
      cus_name: user.full_name,
      cus_email: user.email,
      cus_phone: user.phone,
      product: item.title.en,
      success_url: `${origin}/payment/success?tran=${tran_id}`,
      fail_url: `${origin}/payments/${item.id}?status=fail`,
      cancel_url: `${origin}/payments/${item.id}?status=cancel`,
    });
    return NextResponse.json({ ...result, tran_id, item_id: item.id, amount: item.amount });
  } catch (e) {
    return NextResponse.json(
      { error: "gateway_error", detail: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}
