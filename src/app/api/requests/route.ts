import { NextResponse } from "next/server";
import { listOpenRequests, insertRequest, insertBroadcast, uid, dbNow } from "@/lib/store";
import { requireUser } from "@/lib/session";
import type { EmergencyRequest, Urgency } from "@/lib/types";

export const runtime = "edge";


export async function GET() {
  try {
    const requests = await listOpenRequests();
    return NextResponse.json({ requests });
  } catch (e) {
    console.error("requests GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const body = await req.json();
  if (!body.kind || !body.phone || !body.location) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    const r: EmergencyRequest = {
      id: uid("r"),
      kind: body.kind,
      urgency: (body.urgency ?? "within_1_2_hr") as Urgency,
      patient_name: body.patient_name,
      phone: body.phone,
      alt_phone: body.alt_phone || undefined,
      hospital: body.hospital,
      blood_group: body.blood_group,
      patient_type: body.patient_type,
      location: body.location,
      detail_location: body.detail_location,
      needed_at: body.needed_at,
      note: body.note,
      status: "open",
      created_by: user.id,
      created_at: dbNow(),
    };
    await insertRequest(r);
    // immediate requests hit the global emergency feed instantly
    if (r.urgency === "immediate") {
      await insertBroadcast({
        id: uid("bc"),
        title: {
          en: `EMERGENCY: ${r.kind === "blood" ? `Blood (${r.blood_group ?? "?"})` : r.kind} needed — ${r.location}`,
          bn: `ইমার্জেন্সি: ${r.kind === "blood" ? `রক্ত (${r.blood_group ?? "?"})` : r.kind === "accident" ? "দুর্ঘটনা" : "সাহায্য"} প্রয়োজন — ${r.location}`,
        },
        body: { en: `Contact: ${r.phone}`, bn: `যোগাযোগ: ${r.phone}` },
        severity: "critical", source: "request", active: true,
        link: `/requests/${r.id}`, created_at: dbNow(),
      });
    }
    return NextResponse.json({ request: r }, { status: 201 });
  } catch (e) {
    console.error("requests POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
