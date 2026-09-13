import { NextResponse } from "next/server";
import { z } from "zod";
import { listContacts, insertContact, uid, dbNow } from "@/lib/store";
import { requireAdmin } from "@/lib/session";

export const runtime = "edge";


/** Public: active contacts for the footer. Admin (?scope=all): everything. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  try {
    if (scope === "all") {
      const admin = await requireAdmin();
      if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      return NextResponse.json({ contacts: await listContacts(false) });
    }
    return NextResponse.json({ contacts: await listContacts(true) });
  } catch (e) {
    console.error("contacts GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const schema = z.object({
  kind: z.enum(["phone", "email"]),
  label: z.object({ en: z.string().min(1).max(60), bn: z.string().max(60).optional() }),
  value: z.string().min(3).max(120),
  icon: z.string().max(40).default("Phone"),
  active: z.boolean().default(true),
  sort: z.number().int().min(0).max(999).default(0),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.kind === "email" && !d.value.includes("@")) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const contact = {
      id: uid("c"),
      kind: d.kind,
      label: { en: d.label.en, bn: d.label.bn || d.label.en },
      value: d.value.trim(),
      icon: d.icon,
      active: d.active,
      sort: d.sort,
      created_at: dbNow(),
    };
    await insertContact(contact);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (e) {
    console.error("contacts POST error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
