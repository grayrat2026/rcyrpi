import { NextResponse } from "next/server";
import { getEmergencyFeed } from "@/lib/services/emergency";

export const runtime = "edge";


export async function GET() {
  try {
    const alerts = await getEmergencyFeed();
    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ alerts: [] });
  }
}
