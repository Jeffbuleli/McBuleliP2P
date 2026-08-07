import { NextResponse } from "next/server";
import { resolveRdpiDashboardAccess } from "@/lib/rdpi/auth";
import { getRdpiSurveyStats } from "@/lib/rdpi/survey";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const access = await resolveRdpiDashboardAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.reason },
      { status: access.reason === "unauthenticated" ? 401 : 403 },
    );
  }

  const stats = await getRdpiSurveyStats();
  return NextResponse.json({
    ok: true,
    via: access.via,
    email: access.user.email,
    stats,
  });
}
