import { NextResponse } from "next/server";
import { findMemberByLogin, hashPassword } from "@/lib/store";
import { setSessionCookie, toSessionUser } from "@/lib/session";

export const runtime = "edge";


export async function POST(req: Request) {
  const { id, password, role } = (await req.json()) as {
    id?: string; password?: string; role?: "member" | "admin";
  };
  if (!id || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }
  let member: Awaited<ReturnType<typeof findMemberByLogin>> = null;
  try {
    member = await findMemberByLogin(id);
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!member || member.password_hash !== (await hashPassword(password))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  // admin tab requires admin role
  if (role === "admin" && member.role !== "admin") {
    return NextResponse.json({ error: "not_admin" }, { status: 403 });
  }
  if (member.status !== "active") {
    return NextResponse.json({ error: "suspended" }, { status: 403 });
  }
  await setSessionCookie(member.id, member.role);
  return NextResponse.json({ user: toSessionUser(member) });
}
