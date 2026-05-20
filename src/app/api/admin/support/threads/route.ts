import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getSessionUser, StaffAuthError } from "@/lib/session-user";
import { listSupportThreadsForStaff } from "@/lib/support-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const u = await getSessionUser();
    if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const threads = await listSupportThreadsForStaff(u.id);
    return NextResponse.json({ threads });
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }
}
