import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { createStake } from "@/lib/staking-service";
import type { StakingChainAsset } from "@/lib/staking-config";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { recordFinancialAudit } from "@/lib/financial-audit";

const bodyZ = z.object({
  asset: z.enum(["USDT", "PI"]),
  amount: z.string().min(1),
  termDays: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("staking_stake", userId, req);
  if (limited) return limited;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "staking_invalid_amount" }, { status: 400 });
  }
  const r = await createStake({
    userId,
    asset: parsed.data.asset as StakingChainAsset,
    principalStr: parsed.data.amount,
    termDays: parsed.data.termDays,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  recordFinancialAudit({
    userId,
    action: "staking_create",
    req,
    resourceType: "stake",
    resourceId: r.stakeId,
    asset: parsed.data.asset,
    amount: parsed.data.amount,
    meta: { termDays: parsed.data.termDays },
  });
  return NextResponse.json({ ok: true, stakeId: r.stakeId });
}
