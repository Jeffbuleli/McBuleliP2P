import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { buildObservatorySnapshot } from "@/lib/observatory/aggregate";

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, { permission: "observatory.view" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") || "30");
  const windowDays =
    Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(365, daysRaw) : 30;

  const snapshot = buildObservatorySnapshot(windowDays);
  return NextResponse.json({ snapshot, role: auth.role });
}
