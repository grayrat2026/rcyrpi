import { NextResponse } from "next/server";
import { TEMPLATES } from "@/data/templates";

export const runtime = "edge";


export async function GET() {
  return NextResponse.json({ templates: TEMPLATES });
}
