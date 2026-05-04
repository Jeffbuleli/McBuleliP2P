import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { createStake } from "@/lib/staking-service";
import type { StakingChainAsset } from "@/lib/staking-config";

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
  return NextResponse.json({ ok: true, stakeId: r.stakeId });
}
