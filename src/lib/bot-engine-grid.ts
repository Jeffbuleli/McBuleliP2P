import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import {
  gridPriceLevels,
  parseBotGridConfig,
} from "@/lib/bot-grid-config";
import { classifyBinanceAuthError } from "@/lib/binance-api-validate";
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
import { signalSummary } from "@/lib/bot-intelligence";
import {
  appendDecisionSkipLog,
  classifyExecutionError,
  runSpotDecisionOrchestrator,
} from "@/lib/bot-decision";
import {
  getSmoothedScoreState,
  setSmoothedScoreState,
} from "@/lib/bot-decision/score-state";
import { buildIgnoredTrace } from "@/lib/bot-decision/trace";
import { REASON_CATEGORY } from "@/lib/bot-decision/reason-codes";

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
  signalInstanceId?: string;
  readOnlySignal?: boolean;
}): Promise<{ ran: boolean; skipped?: string }> {
  const signalId = args.signalInstanceId ?? args.instanceId;
  const readOnlySignal = args.readOnlySignal ?? false;
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
    const trace = buildIgnoredTrace({
      signal: "NEUTRAL",
      score: 0,
      category: REASON_CATEGORY["RANGE_MARKET"],
      reason_code: "RANGE_MARKET",
      reason_message: `Price ${mid} outside grid ${low}–${high}`,
      debug: { mid, low, high, plan: "grid" },
    });
    await appendDecisionSkipLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      trace,
      plan: "grid",
    });
    await setBotInstanceError(
      args.instanceId,
      `Price ${mid} outside grid range ${low}-${high}`,
    );
    return { ran: false, skipped: "RANGE_MARKET" };
  }

  const smart = {
    smartMode: grid.smartMode,
    minSignalScore: grid.minSignalScore,
    timeframe: grid.timeframe,
  };

  const prevSmooth = await getSmoothedScoreState(signalId);
  const decision = await runSpotDecisionOrchestrator({
    environment: env,
    symbol: grid.symbol,
    smart,
    quoteUsdt: quotePer,
    minQuoteUsdt: 10,
    markPrice: mid,
    previousSmoothedScore: prevSmooth,
  });

  if (decision.status === "IGNORED") {
    await appendDecisionSkipLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      trace: decision.trace,
      technical: decision.technical,
      minRequired: grid.minSignalScore,
      plan: "grid",
    });
    return { ran: false, skipped: decision.trace.reason_code };
  }

  if (!readOnlySignal) {
    await setSmoothedScoreState(args.instanceId, decision.technical.score);
  }
  const execQuote =
    decision.execution.quoteUsdt ?? quotePer;

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
    for (const levelPrice of levels) {
      if (levelPrice >= mid) continue;
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
          price: formatLimitPrice(levelPrice),
          quantity: qtyFromQuote(execQuote, levelPrice),
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
        signal: signalSummary(decision.technical.tradeSignal),
        technical: {
          score: decision.technical.score,
          regime: decision.technical.market_regime,
        },
        risk_level: decision.risk.risk_level,
        ordersPlaced: placed.length,
        quotePerGrid: execQuote,
        levels,
      },
    });
    return { ran: true };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Grid refresh failed";
    const execErr = classifyExecutionError(raw);
    const msg = classifyBinanceAuthError(env, "spot", raw);
    await setBotInstanceError(args.instanceId, msg);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "error",
      detail: { message: msg, execution: execErr, reason_code: execErr.reason_code },
    });
    return { ran: false, skipped: execErr.reason_code };
  }
}
