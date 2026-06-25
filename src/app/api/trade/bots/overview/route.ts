import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import { BOT_PLANS, BOT_PLAN_IDS } from "@/lib/bot-config";
import { listUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { listUserBotInstances } from "@/lib/bot-instance-service";
import { getTradeModeSnapshot } from "@/lib/trade-mode";
import { BOT_DCA_INTERVAL_HOURS } from "@/lib/bot-dca-config";
import { BOT_TRADE_SYMBOLS } from "@/lib/bot-symbols";
import { BOT_TEMPLATES } from "@/lib/bot-templates";
import { getDemoTrialEligibility } from "@/lib/bot-subscription-service";
import { BOT_GRID_REFRESH_HOURS } from "@/lib/bot-grid-config";
import {
  BOT_FUTURES_INTERVAL_HOURS,
  BOT_FUTURES_LEVERAGE,
} from "@/lib/bot-futures-config";
import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";
import { getBotCronHealth } from "@/lib/bot-cron-health";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import { getFuturesEntryIntervalBlock } from "@/lib/bot-futures-lifecycle";

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

  const [subscriptions, instances, tradeMode, isSuperAdmin, demoTrialEligible] =
    await Promise.all([
      listActiveBotSubscriptions(userId),
      listUserBotInstances(userId),
      getTradeModeSnapshot(userId),
      isSuperAdminUserId(userId),
      getDemoTrialEligibility(userId),
    ]);

  const traderProfiles = instances
    .filter((i) => i.planId === "futures_um" && i.status === "active")
    .map((i) => {
      const cfg = i.config as { traderProfile?: string };
      return cfg.traderProfile;
    });

  const cronHealth = await getBotCronHealth({ traderProfiles });
  const minutesSinceLastRun = cronHealth.lastRun
    ? Math.floor(
        (Date.now() - new Date(cronHealth.lastRun.at).getTime()) / 60_000,
      )
    : null;

  const instancesEnriched = await Promise.all(
    instances.map(async (inst) => {
      if (inst.planId !== "futures_um") return inst;
      try {
        const cfg = parseBotFuturesConfig(inst.config);
        if (!cfg) return { ...inst, entryIntervalRemainingMinutes: 0 };
        const block = await getFuturesEntryIntervalBlock({
          instanceId: inst.id,
          intervalHours: cfg.intervalHours,
        });
        return {
          ...inst,
          entryIntervalRemainingMinutes: block.blocked
            ? block.remainingMinutes
            : 0,
        };
      } catch {
        return { ...inst, entryIntervalRemainingMinutes: 0 };
      }
    }),
  );

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
    instances: instancesEnriched,
    dcaOptions: {
      symbols: [...BOT_TRADE_SYMBOLS],
      intervalHours: [...BOT_DCA_INTERVAL_HOURS],
    },
    gridOptions: {
      symbols: [...BOT_TRADE_SYMBOLS],
      refreshHours: [...BOT_GRID_REFRESH_HOURS],
    },
    futuresOptions: {
      symbols: [...BOT_TRADE_SYMBOLS],
      intervalHours: [...BOT_FUTURES_INTERVAL_HOURS],
      leverage: [...BOT_FUTURES_LEVERAGE],
    },
    templates: BOT_TEMPLATES.map((t) => ({
      id: t.id,
      planId: t.planId,
      style: t.style,
      symbol: t.symbol,
      labelKey: t.labelKey,
      tagKey: t.tagKey,
    })),
    demoTrialEligible,
    smartOptions: {
      timeframes: [...BOT_CANDLE_TIMEFRAMES],
      minSignalScores: [25, 35, 45, 55],
    },
    tradeMode,
    keysEncryptionConfigured: Boolean(
      process.env.BOT_KEYS_ENCRYPTION_SECRET?.trim() &&
        process.env.BOT_KEYS_ENCRYPTION_SECRET.trim().length >= 32,
    ),
    cronConfigured: cronHealth.configured,
    cronHealth: {
      configured: cronHealth.configured,
      inlineEnabled: cronHealth.inlineEnabled,
      intervalMinutes: Math.round(cronHealth.intervalMs / 60_000),
      recommendedIntervalMinutes: Math.round(
        cronHealth.recommendedIntervalMs / 60_000,
      ),
      cronNeedsFasterTick: cronHealth.cronNeedsFasterTick,
      lastRunAt: cronHealth.lastRun?.at ?? null,
      lastRunExecuted: cronHealth.lastRun?.executed ?? null,
      lastRunInstances: cronHealth.lastRun?.instances ?? null,
      stale: cronHealth.stale,
      minutesSinceLastRun,
      staleAfterMinutes: Math.round(cronHealth.staleAfterMs / 60_000),
    },
    isSuperAdmin,
  });
}
