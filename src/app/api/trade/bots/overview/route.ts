import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import { BOT_PLANS, BOT_PLAN_IDS } from "@/lib/bot-config";
import { listUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { listUserBotInstances } from "@/lib/bot-instance-service";
import { getTradeModeSnapshot } from "@/lib/trade-mode";
import { BOT_DCA_INTERVAL_HOURS, BOT_DCA_SYMBOLS } from "@/lib/bot-dca-config";
import { BOT_GRID_REFRESH_HOURS } from "@/lib/bot-grid-config";
import {
  BOT_FUTURES_INTERVAL_HOURS,
  BOT_FUTURES_LEVERAGE,
} from "@/lib/bot-futures-config";
import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let credentials: Awaited<ReturnType<typeof listUserBinanceCredentials>> = [];
  try {
    credentials = await listUserBinanceCredentials(userId);
  } catch (e) {
    console.error("[bots/overview] credentials", e);
    return NextResponse.json(
      { error: "bots_credentials_load_failed" },
      { status: 503 },
    );
  }

  const [subscriptions, instances, tradeMode, isSuperAdmin] = await Promise.all([
    listActiveBotSubscriptions(userId),
    listUserBotInstances(userId),
    getTradeModeSnapshot(userId),
    isSuperAdminUserId(userId),
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
    instances,
    dcaOptions: {
      symbols: [...BOT_DCA_SYMBOLS],
      intervalHours: [...BOT_DCA_INTERVAL_HOURS],
    },
    gridOptions: {
      symbols: [...BOT_DCA_SYMBOLS],
      refreshHours: [...BOT_GRID_REFRESH_HOURS],
    },
    futuresOptions: {
      symbols: [...BOT_DCA_SYMBOLS],
      intervalHours: [...BOT_FUTURES_INTERVAL_HOURS],
      leverage: [...BOT_FUTURES_LEVERAGE],
    },
    smartOptions: {
      timeframes: [...BOT_CANDLE_TIMEFRAMES],
      minSignalScores: [25, 35, 45, 55],
    },
    tradeMode,
    keysEncryptionConfigured: Boolean(
      process.env.BOT_KEYS_ENCRYPTION_SECRET?.trim() &&
        process.env.BOT_KEYS_ENCRYPTION_SECRET.trim().length >= 32,
    ),
    isSuperAdmin,
  });
}
