import { NextResponse } from "next/server";
import { communityAdsEnabled } from "@/lib/community/config";
import {
  getAdsPoolSnapshot,
  listAdminAdCampaigns,
} from "@/lib/community/mcb-custodial-service";
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
  const status = url.searchParams.get("status") ?? undefined;
  const campaigns = await listAdminAdCampaigns({
    status: status && status !== "all" ? status : undefined,
    limit: 80,
  });
  const pools = await getAdsPoolSnapshot();

  return NextResponse.json({
    adsEnabled: communityAdsEnabled(),
    campaigns,
    pools,
  });
}
