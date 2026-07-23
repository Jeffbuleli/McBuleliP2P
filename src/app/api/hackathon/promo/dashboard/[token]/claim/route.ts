import { NextResponse } from "next/server";
import { requirePromoDashAuth } from "@/lib/hackathon/promo-dashboard-auth";
import { requestCashbackClaim } from "@/lib/hackathon/promo-claims";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const auth = await requirePromoDashAuth(token);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await requestCashbackClaim({
    dashboardToken: token,
    partnerEmail: auth.email,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    claimId: result.claimId,
    amountUsd: result.amountUsd,
  });
}
