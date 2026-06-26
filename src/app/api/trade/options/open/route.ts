import { NextResponse } from "next/server";
import { z } from "zod";
import { TRADE_OPTIONS_DURATIONS_SEC } from "@/lib/trade-config";
import { getSessionUserId } from "@/lib/session";
import { openSimpleOption } from "@/lib/trade-options-service";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { recordFinancialAudit } from "@/lib/financial-audit";

const bodyZ = z.object({
  mode: z.enum(["demo", "live"]),
  symbol: z.string().min(4),
  direction: z.enum(["call", "put"]),
  stakeUsdt: z.number().positive(),
  durationSec: z.union([
    z.literal(60),
    z.literal(300),
    z.literal(900),
    z.literal(3600),
  ]),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("trade_options", userId, req);
  if (limited) return limited;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "trade_invalid_body" }, { status: 400 });
  }
  const r = await openSimpleOption({
    userId,
    mode: parsed.data.mode,
    symbol: parsed.data.symbol,
    direction: parsed.data.direction,
    stakeUsdt: parsed.data.stakeUsdt,
    durationSec: parsed.data.durationSec,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  recordFinancialAudit({
    userId,
    action: "trade_options_open",
    req,
    resourceType: "trade_option",
    resourceId: r.id,
    asset: "USDT",
    amount: String(parsed.data.stakeUsdt),
    meta: {
      mode: parsed.data.mode,
      symbol: parsed.data.symbol,
      direction: parsed.data.direction,
      durationSec: parsed.data.durationSec,
    },
  });
  return NextResponse.json({ ok: true, id: r.id });
}
