import { NextResponse } from "next/server";
import { isAcademyDbNotReadyError } from "@/lib/academy-db-ready";
import { getAcademyHub } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = await getLocale();
  try {
    const hub = await getAcademyHub({ userId, locale });
    return NextResponse.json(hub);
  } catch (e) {
    if (isAcademyDbNotReadyError(e)) {
      return NextResponse.json(
        { error: "academy_db_not_migrated" },
        { status: 503 },
      );
    }
    console.error("[academy/overview]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
