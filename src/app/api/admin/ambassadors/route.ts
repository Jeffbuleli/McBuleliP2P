import { NextResponse } from "next/server";
import {
  AMBASSADOR_STATUS,
  isAmbassadorStatus,
  type AmbassadorStatus,
} from "@/lib/community/ambassador-config";
import { listAdminAmbassadorApplications } from "@/lib/community/ambassador-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && isAmbassadorStatus(statusParam)
      ? (statusParam as AmbassadorStatus)
      : statusParam === "all"
        ? undefined
        : AMBASSADOR_STATUS.PENDING;

  const applications = await listAdminAmbassadorApplications({
    status,
    limit: 100,
  });
  return NextResponse.json({ applications });
}
