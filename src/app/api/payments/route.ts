import { NextResponse } from "next/server";
import { listPayments } from "@/lib/store";
import { requireUser } from "@/lib/session";

export const runtime = "edge";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // mine | all
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  try {
    if (scope === "all") {
      if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const payments = await listPayments();
      return NextResponse.json({ payments });
    }
    const payments = await listPayments(user.id);
    return NextResponse.json({ payments });
  } catch (e) {
    console.error("payments GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
