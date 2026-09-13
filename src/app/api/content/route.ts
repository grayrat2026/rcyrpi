import { NextResponse } from "next/server";
import { getHomeSections, putHomeSections } from "@/lib/store";
import { requireAdmin } from "@/lib/session";
import type { HomeSectionCfg, SectionKey } from "@/lib/types";

export const runtime = "edge";


const VALID: SectionKey[] = [
  "hero", "stats", "emergency_strip", "activities", "events",
  "schedule", "principles", "about", "join_cta",
];

export async function GET() {
  try {
    const sections = await getHomeSections();
    return NextResponse.json({ sections });
  } catch (e) {
    console.error("content GET error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Admin: save reordered / toggled home sections (drag & drop builder) */
export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { sections } = (await req.json()) as { sections: HomeSectionCfg[] };
  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    const clean: HomeSectionCfg[] = sections
      .filter((s) => VALID.includes(s.key))
      .map((s) => ({
        key: s.key,
        visible: Boolean(s.visible),
        title: s.title ?? undefined,
        subtitle: s.subtitle ?? undefined,
      }));
    // ensure every section key exists exactly once (append missing)
    const existing = new Set(clean.map((s) => s.key));
    for (const k of VALID) {
      if (!existing.has(k)) clean.push({ key: k, visible: true });
    }
    await putHomeSections(clean);
    return NextResponse.json({ sections: await getHomeSections() });
  } catch (e) {
    console.error("content PUT error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
