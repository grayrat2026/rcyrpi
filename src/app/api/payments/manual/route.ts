import { NextResponse } from "next/server";
import { getMemberById, getItem, getPayment, insertPayment, uid, dbNow } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import type { PaymentRecord, PayStatus } from "@/lib/types";

export const runtime = "edge";


/**
 * Admin: manually add a payment record for any member.
 * The record is stamped with the admin who created it —
 * "xyz admin marked abc user as Paid / Due / Cancelled".
 * (0-taka funds never need a payment — amount must be > 0.)
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { member_id, item_id, amount, status, note } = await req.json();
  try {
    const member = await getMemberById(String(member_id ?? ""));
    if (!member) return NextResponse.json({ error: "member_not_found" }, { status: 404 });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "bad_amount" }, { status: 400 });
    }
    const st = String(status ?? "success") as PayStatus;
    if (!["success", "due", "cancelled"].includes(st)) {
      return NextResponse.json({ error: "bad_status" }, { status: 400 });
    }

    let itemTitle = { en: "General", bn: "সাধারণ" } as PaymentRecord["item_title"];
    let itemId: string | undefined;
    if (item_id) {
      const item = await getItem(String(item_id));
      if (item) {
        itemId = item.id;
        itemTitle = item.title;
      }
    }

    const record: PaymentRecord = {
      id: uid("p"),
      tran_id: `RCY-ADMIN-${Date.now().toString(36).toUpperCase()}`,
      member_id: member.id,
      member_name: member.full_name,
      item_id: itemId ?? "",
      item_title: itemTitle,
      amount: amt,
      method: "admin",
      status: st,
      note: note?.trim() || undefined,
      source: "admin",
      admin_username: admin.username,
      admin_name: admin.full_name,
      created_at: dbNow(),
      verified_at: st === "success" ? dbNow() : undefined,
      verified_by: st === "success" ? `admin:${admin.username}` : undefined,
    };
    await insertPayment(record);
    return NextResponse.json({ payment: record }, { status: 201 });
  } catch (e) {
    console.error("payments manual error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin: settle / cancel an existing due record — attribution preserved+updated */
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, action } = await req.json(); // action: settle | cancel
  try {
    const p = await getPayment(String(id ?? ""));
    if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (p.status !== "due") {
      return NextResponse.json({ error: "not_due" }, { status: 400 });
    }
    const { updatePayment } = await import("@/lib/store");
    if (action === "settle") {
      await updatePayment(p.id, {
        status: "success",
        verified_at: dbNow(),
        verified_by: `admin:${admin.username}`,
        admin_username: admin.username,
        admin_name: admin.full_name,
      });
    } else if (action === "cancel") {
      await updatePayment(p.id, {
        status: "cancelled",
        admin_username: admin.username,
        admin_name: admin.full_name,
        note: `${p.note ? p.note + " — " : ""}Cancelled by ${admin.full_name}`,
      });
    } else {
      return NextResponse.json({ error: "bad_action" }, { status: 400 });
    }
    return NextResponse.json({ payment: await getPayment(p.id) });
  } catch (e) {
    console.error("payments manual PATCH error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
