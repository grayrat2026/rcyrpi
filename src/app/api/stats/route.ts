import { NextResponse } from "next/server";
import { supabaseAdmin, toMember, toPayment, toItem } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [membersRes, noticesRes, requestsRes, broadcastsRes, itemsRes, paymentsRes] =
      await Promise.all([
        supabaseAdmin().from("members").select("id,role,status"),
        supabaseAdmin().from("notices").select("id"),
        supabaseAdmin().from("emergency_requests").select("id,status"),
        supabaseAdmin().from("broadcasts").select("id,active"),
        supabaseAdmin().from("items").select("id,kind,status,payment_required"),
        supabaseAdmin().from("payments").select("id,status,member_id,amount"),
      ]);
    const members = (membersRes.data ?? []).map(toMember);
    const items = (itemsRes.data ?? []).map(toItem);
    const payments = (paymentsRes.data ?? []).map(toPayment);
    const verified = payments.filter((p) => p.status === "success");
    const dues = items.filter((i) => i.payment_required && i.status === "active");
    const paidMembers = new Set(verified.map((p) => p.member_id));
    return NextResponse.json({
      stats: {
        members_total: members.filter((m) => m.role === "member").length,
        members_active: members.filter((m) => m.role === "member" && m.status === "active").length,
        notices_total: (noticesRes.data ?? []).length,
        emergencies_open: (requestsRes.data ?? []).filter((r: any) => r.status === "open").length,
        broadcasts_active: (broadcastsRes.data ?? []).filter((b: any) => b.active).length,
        items_active: items.filter((i) => i.status === "active").length,
        events_active: items.filter((i) => i.kind === "event" && i.status === "active").length,
        collections_total: verified.reduce((s, p) => s + p.amount, 0),
        payments_verified: verified.length,
        payments_pending: payments.filter((p) => p.status === "pending" || p.status === "submitted").length,
        items_with_due: dues.length,
        paid_coverage: dues.length
          ? Math.round((paidMembers.size / Math.max(members.length - 1, 1)) * 100)
          : 0,
      },
    });
  } catch (e) {
    console.error("stats GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
