import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getSecurityStatus } from "@/lib/auth/security-status";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getSecurityStatus(userId);
  if (!status) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(status);
}
