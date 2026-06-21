import { NextResponse } from "next/server";
import { getEventDashboardKpis } from "@/lib/events/events-service";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const kpis = await getEventDashboardKpis();
  return NextResponse.json({ ok: true, kpis });
}
