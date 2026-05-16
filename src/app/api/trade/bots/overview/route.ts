import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { BOT_PLANS, BOT_PLAN_IDS } from "@/lib/bot-config";
import { listUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { getTradeModeSnapshot } from "@/lib/trade-mode";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [credentials, subscriptions, tradeMode] = await Promise.all([
    listUserBinanceCredentials(userId),
    listActiveBotSubscriptions(userId),
    getTradeModeSnapshot(userId),
  ]);

  const plans = BOT_PLAN_IDS.map((id) => {
    const p = BOT_PLANS[id];
    return {
      id,
      livePriceUsdt: p.livePriceUsdt,
      demoPriceUsdt: p.demoPriceUsdt,
      requiresSpot: p.requiresSpot,
      requiresFutures: p.requiresFutures,
    };
  });

  return NextResponse.json({
    plans,
    credentials,
    subscriptions,
    tradeMode,
    keysEncryptionConfigured: Boolean(
      process.env.BOT_KEYS_ENCRYPTION_SECRET?.trim() &&
        process.env.BOT_KEYS_ENCRYPTION_SECRET.trim().length >= 32,
    ),
  });
}
