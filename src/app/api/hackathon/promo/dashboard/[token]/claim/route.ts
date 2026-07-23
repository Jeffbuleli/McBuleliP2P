import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePromoDashAuth } from "@/lib/hackathon/promo-dashboard-auth";
import { requestCashbackClaim } from "@/lib/hackathon/promo-claims";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  amountUsd: z.coerce.number().positive(),
  phoneNumber: z.string().min(6).max(32),
  provider: z.string().min(2).max(64),
  providerLabel: z.string().min(1).max(120).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const auth = await requirePromoDashAuth(token);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await requestCashbackClaim({
    dashboardToken: token,
    partnerEmail: auth.email,
    amountUsd: parsed.data.amountUsd,
    phoneNumber: parsed.data.phoneNumber,
    provider: parsed.data.provider,
    providerLabel: parsed.data.providerLabel,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    claimId: result.claimId,
    amountUsd: result.amountUsd,
    payoutReference: result.payoutReference,
    payoutStatus: result.payoutStatus,
  });
}
