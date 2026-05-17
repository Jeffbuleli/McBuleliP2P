import { NextResponse } from "next/server";
import { UserRole } from "@/lib/roles";
import { runBotsTick } from "@/lib/bot-tick-service";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

/** Super-admin: run one cron pass immediately (for debugging). */
export async function POST() {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const out = await runBotsTick();
  return NextResponse.json({ ok: true, ...out });
}
