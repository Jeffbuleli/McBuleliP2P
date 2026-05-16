import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { isBotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import { getActiveBotSubscription } from "@/lib/bot-subscription-service";
import {
  evaluateTradeSignal,
  fetchMarketContext,
  signalSummary,
} from "@/lib/bot-intelligence";
import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";

const queryZ = z.object({
  symbol: z.string(),
  planId: z.enum(["dca_spot", "grid_spot", "futures_um"]),
  timeframe: z.enum(BOT_CANDLE_TIMEFRAMES).optional(),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = queryZ.safeParse({
    symbol: searchParams.get("symbol"),
    planId: searchParams.get("planId"),
    timeframe: searchParams.get("timeframe") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const { symbol, planId, timeframe } = parsed.data;
  if (!isBotPlanId(planId)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const sub = await getActiveBotSubscription(userId, planId);
  if (!sub) {
    return NextResponse.json({ error: "bots_subscription_required" }, { status: 409 });
  }

  const env = billingToKeyEnvironment(sub.billing);
  const market = planId === "futures_um" ? "futures" : "spot";
  const ctx = await fetchMarketContext({
    environment: env,
    symbol: symbol.toUpperCase(),
    market,
    timeframe: timeframe ?? "1h",
  });
  if (!ctx) {
    return NextResponse.json({ error: "smart_market_data_unavailable" }, { status: 502 });
  }

  const signal = evaluateTradeSignal(ctx);
  return NextResponse.json({
    summary: signalSummary(signal),
    score: signal.score,
    bias: signal.bias,
    reasons: signal.reasons,
    rsi14: ctx.indicators.rsi14,
    fundingRate: ctx.fundingRate,
    openInterest: ctx.openInterest,
    bookImbalance: ctx.orderBook?.imbalance ?? null,
  });
}
