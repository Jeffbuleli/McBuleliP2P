import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { isP2pReportReason, submitP2pUserReport } from "@/lib/p2p-report-service";

const postZ = z.object({
  reportedUserId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  reason: z.enum(["scam", "abuse", "no_payment", "no_release", "other"]),
  details: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_report_invalid" }, { status: 400 });
  }

  if (!isP2pReportReason(parsed.data.reason)) {
    return NextResponse.json({ error: "p2p_report_invalid" }, { status: 400 });
  }

  const r = await submitP2pUserReport({
    reporterId: userId,
    reportedUserId: parsed.data.reportedUserId,
    orderId: parsed.data.orderId ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
