import { NextResponse } from "next/server";
import { listAuditAccess } from "@/lib/access";
import { requireOpsAuth } from "@/lib/ops/auth";

/** Audit acces dossiers - admin only. */
export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.stats",
    roles: ["admin"],
  });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") || "50") || 50),
  );

  return NextResponse.json({
    count: limit,
    entries: listAuditAccess(limit),
  });
}
