import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import {
  listOpenP2pUserReports,
  resolveP2pUserReport,
} from "@/lib/p2p-report-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaffScope("p2p_disputes");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }
  const reports = await listOpenP2pUserReports();
  return NextResponse.json({ reports });
}

const patchZ = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["resolved", "dismissed"]),
});

export async function PATCH(req: Request) {
  try {
    await requireStaffScope("p2p_disputes");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const r = await resolveP2pUserReport({
    reportId: parsed.data.reportId,
    status: parsed.data.status,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
