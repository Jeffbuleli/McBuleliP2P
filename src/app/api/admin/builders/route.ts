import { NextResponse } from "next/server";
import { listAdminBuildersMemberships } from "@/lib/builders/builders-service";
import {
  BUILDERS_MEMBERSHIP_STATUS,
  type BuildersMembershipStatus,
} from "@/lib/builders/builders-config";
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
    statusParam &&
    (Object.values(BUILDERS_MEMBERSHIP_STATUS) as string[]).includes(
      statusParam,
    )
      ? (statusParam as BuildersMembershipStatus)
      : undefined;

  const memberships = await listAdminBuildersMemberships({
    status,
    limit: 100,
  });
  return NextResponse.json({ memberships });
}
