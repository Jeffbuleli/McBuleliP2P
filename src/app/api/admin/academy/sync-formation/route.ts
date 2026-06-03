import { NextResponse } from "next/server";
import { backfillFormationToAcademy } from "@/lib/academy-service";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST() {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await backfillFormationToAcademy();
  return NextResponse.json({ ok: true, ...result });
}
