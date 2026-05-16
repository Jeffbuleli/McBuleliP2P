import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import { parseBotDcaConfig } from "@/lib/bot-dca-config";
import { loadUserBinanceCredentials } from "@/lib/bot-credentials-service";
import { getActiveBotSubscription } from "@/lib/bot-subscription-service";
import {
  appendBotExecutionLog,
  markBotInstanceSuccess,
  setBotInstanceError,
} from "@/lib/bot-instance-service";
import { binanceUserSignedPost } from "@/lib/binance-user-client";

export async function tickDcaSpotInstance(args: {
  instanceId: string;
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  config: Record<string, unknown>;
  lastExecutedAt: Date | null;
}): Promise<{ ran: boolean; skipped?: string }> {
  const sub = await getActiveBotSubscription(args.userId, args.planId);
  if (!sub || sub.billing !== args.billing) {
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
        quoteOrderQty: String(quoteQty),
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
        quoteAmountUsdt: dca.quoteAmountUsdt,
        order,
      },
    });
    return { ran: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DCA order failed";
    await setBotInstanceError(args.instanceId, msg);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "error",
      detail: { message: msg },
    });
    return { ran: false, skipped: "order_failed" };
  }
}
