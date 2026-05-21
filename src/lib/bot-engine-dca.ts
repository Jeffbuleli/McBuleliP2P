import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import { parseBotDcaConfig } from "@/lib/bot-dca-config";
import { classifyBinanceAuthError } from "@/lib/binance-api-validate";
import { loadUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { botAccessAllows } from "@/lib/bot-privilege";
import {
  appendBotExecutionLog,
  markBotInstanceSuccess,
  setBotInstanceError,
} from "@/lib/bot-instance-service";
import { binanceUserSignedPost, fetchBinanceSpotPrice } from "@/lib/binance-user-client";
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

export async function tickDcaSpotInstance(args: {
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

  const dca = parseBotDcaConfig(args.config);
  if (!dca) {
    await setBotInstanceError(args.instanceId, "Invalid DCA config");
    return { ran: false, skipped: "invalid_config" };
  }

  const env = billingToKeyEnvironment(args.billing);
  const creds = await loadUserBinanceCredentials(args.userId, env);
  if (!creds) {
    await setBotInstanceError(args.instanceId, "API keys not connected");
    return { ran: false, skipped: "no_keys" };
  }

  const intervalMs = dca.intervalHours * 60 * 60 * 1000;
  if (
    args.lastExecutedAt &&
    Date.now() - args.lastExecutedAt.getTime() < intervalMs
  ) {
    return { ran: false, skipped: "interval_not_elapsed" };
  }

  const quoteQty = Number(dca.quoteAmountUsdt);
  if (!Number.isFinite(quoteQty) || quoteQty < 5) {
    await setBotInstanceError(args.instanceId, "quoteAmountUsdt too small");
    return { ran: false, skipped: "amount_too_small" };
  }

  const price = await fetchBinanceSpotPrice(env, dca.symbol);
  if (!price) {
    await setBotInstanceError(args.instanceId, "Could not fetch spot price");
    return { ran: false, skipped: "price_unavailable" };
  }

  const smart = {
    smartMode: dca.smartMode,
    minSignalScore: dca.minSignalScore,
    timeframe: dca.timeframe,
  };

  const prevSmooth = await getSmoothedScoreState(args.instanceId);
  const decision = await runSpotDecisionOrchestrator({
    environment: env,
    symbol: dca.symbol,
    smart,
    quoteUsdt: quoteQty,
    minQuoteUsdt: 5,
    markPrice: price,
    previousSmoothedScore: prevSmooth,
  });

  if (decision.status === "IGNORED") {
    await appendDecisionSkipLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      trace: decision.trace,
      technical: decision.technical,
      minRequired: dca.minSignalScore,
      plan: "dca",
    });
    return { ran: false, skipped: decision.trace.reason_code };
  }

  await setSmoothedScoreState(args.instanceId, decision.technical.score);
  const execQuote = decision.execution.quoteUsdt ?? quoteQty;

  try {
    const order = await binanceUserSignedPost({
      environment: env,
      creds,
      market: "spot",
      path: "/api/v3/order",
      params: {
        symbol: dca.symbol,
        side: "BUY",
        type: "MARKET",
        quoteOrderQty: String(execQuote),
      },
    });

    await markBotInstanceSuccess(args.instanceId);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "dca_buy",
      detail: {
        symbol: dca.symbol,
        quoteAmountUsdt: String(execQuote),
        signal: signalSummary(decision.technical.tradeSignal),
        technical: {
          score: decision.technical.score,
          regime: decision.technical.market_regime,
        },
        risk_level: decision.risk.risk_level,
        order,
      },
    });
    return { ran: true };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "DCA order failed";
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
