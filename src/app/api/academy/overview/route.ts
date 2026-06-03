import { NextResponse } from "next/server";
import { isAcademyDbNotReadyError } from "@/lib/academy-db-ready";
import { getAcademyHub, type AcademyViewerRole } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = await getLocale();
  const viewerRole: AcademyViewerRole =
    user.role === "agent" || user.role === "super_admin" ? "staff" : "learner";
  try {
    const hub = await getAcademyHub({
      userId: user.id,
      locale,
      viewerRole,
    });
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
