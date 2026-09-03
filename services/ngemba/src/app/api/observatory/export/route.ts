import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import {
  csvFromAnonymized,
  exportAnonymizedRows,
} from "@/lib/observatory/aggregate";

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, { permission: "observatory.export" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") || "30");
  const windowDays =
    Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(365, daysRaw) : 30;
  const format = (url.searchParams.get("format") || "csv").toLowerCase();

  const rows = exportAnonymizedRows(windowDays);

  if (format === "json") {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      windowDays,
      count: rows.length,
      rows,
      note: "Export anonymise - zones k-anonymes seulement, sans PII.",
    });
  }

  const csv = csvFromAnonymized(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ngemba-observatory-${windowDays}d.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
