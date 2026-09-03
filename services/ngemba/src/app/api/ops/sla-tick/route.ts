import { NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { runSlaTick } from "@/lib/ops/sla-engine";

/** Declenche l'evaluation SLA + escalades (cron ou admin). */
export async function POST(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.list",
    roles: ["admin"],
  });
  if (auth instanceof NextResponse) return auth;

  const result = runSlaTick(120);
  return NextResponse.json({
    ok: true,
    ...result,
    at: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  return POST(req);
}
