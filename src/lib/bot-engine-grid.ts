import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import {
  gridPriceLevels,
  parseBotGridConfig,
} from "@/lib/bot-grid-config";
import { loadUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { botAccessAllows } from "@/lib/bot-privilege";
import {
  appendBotExecutionLog,
  markBotInstanceSuccess,
  setBotInstanceError,
} from "@/lib/bot-instance-service";
import {
  binanceUserSignedDelete,
  binanceUserSignedGet,
  binanceUserSignedPost,
  fetchBinanceSpotPrice,
} from "@/lib/binance-user-client";
import { runSmartGate, signalSummary } from "@/lib/bot-intelligence";

type OpenOrder = {
  orderId: number;
  symbol: string;
};

function formatLimitPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function qtyFromQuote(quoteUsdt: number, price: number): string {
  const q = quoteUsdt / price;
  if (q >= 1) return q.toFixed(4);
  if (q >= 0.01) return q.toFixed(6);
  return q.toFixed(8);
}

export async function tickGridSpotInstance(args: {
  instanceId: string;
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  config: Record<string, unknown>;
  lastExecutedAt: Date | null;
}): Promise<{ ran: boolean; skipped?: string }> {
  const allowed = await botAccessAllows(args.userId, args.planId, args.billing);
  if (!allowed) {
    return { ran: false, skipped: "no_active_subscription" };
  }

  const grid = parseBotGridConfig(args.config);
  if (!grid) {
    await setBotInstanceError(args.instanceId, "Invalid grid config");
    return { ran: false, skipped: "invalid_config" };
  }

  const env = billingToKeyEnvironment(args.billing);
  const creds = await loadUserBinanceCredentials(args.userId, env);
  if (!creds) {
    await setBotInstanceError(args.instanceId, "API keys not connected");
    return { ran: false, skipped: "no_keys" };
  }

  const refreshMs = grid.refreshHours * 60 * 60 * 1000;
  if (
    args.lastExecutedAt &&
    Date.now() - args.lastExecutedAt.getTime() < refreshMs
  ) {
    return { ran: false, skipped: "interval_not_elapsed" };
  }

  const quotePer = Number(grid.quotePerGrid);
  if (!Number.isFinite(quotePer) || quotePer < 10) {
    await setBotInstanceError(args.instanceId, "quotePerGrid too small");
    return { ran: false, skipped: "amount_too_small" };
  }

  const mid = await fetchBinanceSpotPrice(env, grid.symbol);
  if (!mid) {
    await setBotInstanceError(args.instanceId, "Could not fetch spot price");
    return { ran: false, skipped: "price_unavailable" };
  }

  const low = Number(grid.priceLow);
  const high = Number(grid.priceHigh);
  if (mid < low || mid > high) {
    await setBotInstanceError(
      args.instanceId,
      `Price ${mid} outside grid range ${low}-${high}`,
    );
    return { ran: false, skipped: "price_out_of_range" };
  }

  const gate = await runSmartGate({
    environment: env,
    symbol: grid.symbol,
    market: "spot",
    smart: {
      smartMode: grid.smartMode,
      minSignalScore: grid.minSignalScore,
      timeframe: grid.timeframe,
    },
    intent: "spot_buy",
  });
  if (!gate.ok) {
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "smart_skip",
      detail: {
        reason: gate.reason,
        score: gate.signal?.score,
        factors: gate.signal?.reasons,
      },
    });
    return { ran: false, skipped: "smart_blocked" };
  }

  try {
    const openRaw = (await binanceUserSignedGet({
      environment: env,
      creds,
      market: "spot",
      path: "/api/v3/openOrders",
      params: { symbol: grid.symbol },
    })) as OpenOrder[];

    for (const o of openRaw ?? []) {
      await binanceUserSignedDelete({
        environment: env,
        creds,
        market: "spot",
        path: "/api/v3/order",
        params: {
          symbol: grid.symbol,
          orderId: String(o.orderId),
        },
      });
    }

    const levels = gridPriceLevels(grid);
    const placed: unknown[] = [];
    for (const price of levels) {
      if (price >= mid) continue;
      const order = await binanceUserSignedPost({
        environment: env,
        creds,
        market: "spot",
        path: "/api/v3/order",
        params: {
          symbol: grid.symbol,
          side: "BUY",
          type: "LIMIT",
          timeInForce: "GTC",
          price: formatLimitPrice(price),
          quantity: qtyFromQuote(quotePer, price),
        },
      });
      placed.push(order);
    }

    await markBotInstanceSuccess(args.instanceId);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "grid_refresh",
      detail: {
        symbol: grid.symbol,
        mid,
        signal: signalSummary(gate.signal),
        ordersPlaced: placed.length,
        levels,
      },
    });
    return { ran: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Grid refresh failed";
    await setBotInstanceError(args.instanceId, msg);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "error",
      detail: { message: msg },
    });
    return { ran: false, skipped: "grid_failed" };
  }
}
