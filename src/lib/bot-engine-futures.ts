import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import { loadUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { botAccessAllows } from "@/lib/bot-privilege";
import {
  appendBotExecutionLog,
  markBotInstanceSuccess,
  setBotInstanceError,
} from "@/lib/bot-instance-service";
import { fetchBinanceFuturesMarkPrice } from "@/lib/binance-user-client";
import {
  futuresSignedGet,
  futuresSignedPost,
  resolveFuturesApiKind,
} from "@/lib/binance-futures-routing";
import { runSmartGate, signalSummary } from "@/lib/bot-intelligence";

type PositionRisk = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
};

function formatFuturesQty(qty: number): string {
  if (qty >= 1) return qty.toFixed(3);
  if (qty >= 0.01) return qty.toFixed(4);
  return qty.toFixed(6);
}

function qtyFromMargin(marginUsdt: number, leverage: number, price: number): string {
  const notional = marginUsdt * leverage;
  return formatFuturesQty(notional / price);
}

function shouldClosePosition(args: {
  side: "LONG" | "SHORT";
  entry: number;
  mark: number;
  stopLossPct: number;
  takeProfitPct: number;
}): "sl" | "tp" | null {
  const { side, entry, mark, stopLossPct, takeProfitPct } = args;
  if (!Number.isFinite(entry) || entry <= 0) return null;
  if (side === "LONG") {
    if (mark <= entry * (1 - stopLossPct / 100)) return "sl";
    if (mark >= entry * (1 + takeProfitPct / 100)) return "tp";
  } else {
    if (mark >= entry * (1 + stopLossPct / 100)) return "sl";
    if (mark <= entry * (1 - takeProfitPct / 100)) return "tp";
  }
  return null;
}

async function fetchPosition(
  env: ReturnType<typeof billingToKeyEnvironment>,
  creds: NonNullable<Awaited<ReturnType<typeof loadUserBinanceCredentials>>>,
  symbol: string,
  apiKind: Awaited<ReturnType<typeof resolveFuturesApiKind>>,
): Promise<{ amt: number; entry: number } | null> {
  const rows = (await futuresSignedGet({
    environment: env,
    creds,
    kind: apiKind,
    pathKey: "positionRisk",
    params: { symbol },
  })) as PositionRisk[];
  const row = rows.find((r) => r.symbol === symbol);
  if (!row) return null;
  const amt = Number(row.positionAmt);
  const entry = Number(row.entryPrice);
  if (!Number.isFinite(amt) || Math.abs(amt) < 1e-12) return null;
  return { amt, entry };
}

export async function tickFuturesUmInstance(args: {
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

  const cfg = parseBotFuturesConfig(args.config);
  if (!cfg) {
    await setBotInstanceError(args.instanceId, "Invalid futures config");
    return { ran: false, skipped: "invalid_config" };
  }

  const env = billingToKeyEnvironment(args.billing);
  const creds = await loadUserBinanceCredentials(args.userId, env);
  if (!creds) {
    await setBotInstanceError(args.instanceId, "API keys not connected");
    return { ran: false, skipped: "no_keys" };
  }

  const margin = Number(cfg.marginUsdt);
  if (!Number.isFinite(margin) || margin < 10) {
    await setBotInstanceError(args.instanceId, "marginUsdt too small (min 10)");
    return { ran: false, skipped: "amount_too_small" };
  }

  const mark = await fetchBinanceFuturesMarkPrice(env, cfg.symbol);
  if (!mark) {
    await setBotInstanceError(args.instanceId, "Could not fetch futures mark price");
    return { ran: false, skipped: "price_unavailable" };
  }

  const futuresKind = await resolveFuturesApiKind(env, creds);

  try {
    const position = await fetchPosition(env, creds, cfg.symbol, futuresKind);

    if (position) {
      const closeReason = shouldClosePosition({
        side: cfg.side,
        entry: position.entry,
        mark,
        stopLossPct: cfg.stopLossPct,
        takeProfitPct: cfg.takeProfitPct,
      });
      if (closeReason) {
        const closeSide = position.amt > 0 ? "SELL" : "BUY";
        const order = await binanceUserSignedPost({
          environment: env,
          creds,
          market: "futures",
          path: "/fapi/v1/order",
          params: {
            symbol: cfg.symbol,
            side: closeSide,
            type: "MARKET",
            quantity: formatFuturesQty(Math.abs(position.amt)),
            reduceOnly: "true",
          },
        });
        await markBotInstanceSuccess(args.instanceId);
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: closeReason === "sl" ? "futures_sl_close" : "futures_tp_close",
          detail: { symbol: cfg.symbol, mark, entry: position.entry, order },
        });
        return { ran: true };
      }
      return { ran: false, skipped: "position_open" };
    }

    const intervalMs = cfg.intervalHours * 60 * 60 * 1000;
    if (
      args.lastExecutedAt &&
      Date.now() - args.lastExecutedAt.getTime() < intervalMs
    ) {
      return { ran: false, skipped: "interval_not_elapsed" };
    }

    const gate = await runSmartGate({
      environment: env,
      symbol: cfg.symbol,
      market: "futures",
      smart: {
        smartMode: cfg.smartMode,
        minSignalScore: cfg.minSignalScore,
        timeframe: cfg.timeframe,
      },
      intent: cfg.side === "LONG" ? "long" : "short",
    });
    if (!gate.ok) {
      await appendBotExecutionLog({
        instanceId: args.instanceId,
        userId: args.userId,
        planId: args.planId,
        action: "smart_skip",
        detail: {
          reason: gate.reason,
          summary: gate.signal ? signalSummary(gate.signal) : null,
          score: gate.signal?.score,
          factors: gate.signal?.reasons,
        },
      });
      return { ran: false, skipped: "smart_blocked" };
    }

    await futuresSignedPost({
      environment: env,
      creds,
      kind: futuresKind,
      pathKey: "leverage",
      params: {
        symbol: cfg.symbol,
        leverage: String(cfg.leverage),
      },
    });

    const openSide = cfg.side === "LONG" ? "BUY" : "SELL";
    const order = await futuresSignedPost({
      environment: env,
      creds,
      kind: futuresKind,
      pathKey: "order",
      params: {
        symbol: cfg.symbol,
        side: openSide,
        type: "MARKET",
        quantity: qtyFromMargin(margin, cfg.leverage, mark),
      },
    });

    await markBotInstanceSuccess(args.instanceId);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "futures_open",
      detail: {
        symbol: cfg.symbol,
        side: cfg.side,
        leverage: cfg.leverage,
        marginUsdt: cfg.marginUsdt,
        mark,
        signal: gate.ok ? signalSummary(gate.signal) : null,
        order,
      },
    });
    return { ran: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Futures order failed";
    await setBotInstanceError(args.instanceId, msg);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "error",
      detail: { message: msg },
    });
    return { ran: false, skipped: "futures_failed" };
  }
}
