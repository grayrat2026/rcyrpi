import { NextResponse } from "next/server";
import { listMembers } from "@/lib/store";
import { requireAdmin, toSessionUser } from "@/lib/session";

export const runtime = "edge";


export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const members = await listMembers();
    return NextResponse.json({
      members: members.map((m) => ({
        ...toSessionUser(m),
        status: m.status,
        created_at: m.created_at,
        alt_phone: m.alt_phone,
      })),
    });
  } catch (e) {
    console.error("members GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
