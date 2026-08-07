import { NextResponse } from "next/server";
import { resolveRdpiDashboardAccess } from "@/lib/rdpi/auth";
import {
  listRdpiResponsesForExport,
  rdpiResponsesToCsv,
} from "@/lib/rdpi/survey";

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

  const rows = await listRdpiResponsesForExport();
  const csv = rdpiResponsesToCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdpi-enquete-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
