import type { BotEnvironment } from "@/lib/bot-config";
import {
  runSmartGate,
  signalSummary,
} from "@/lib/bot-intelligence";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import {
  getAiSignalStatus,
  storeAiSignal,
  type AiSignalAction,
} from "@/lib/bot-ai-signal";

export const AI_STRATEGY_WORKER = "WORKER" as const;
export const AI_STRATEGY_TA_SYNC = "TA_SYNC" as const;

/** Min interval between in-app TA sync signals (avoids API spam on UI poll). */
const TA_SYNC_MIN_INTERVAL_MS = 90_000;

function actionFromTa(args: {
  side: "LONG" | "SHORT";
  gateOk: boolean;
  score: number;
}): AiSignalAction {
  if (!args.gateOk) return "HOLD";
  if (args.side === "LONG") return args.score >= 0 ? "LONG" : "HOLD";
  return args.score <= 0 ? "SHORT" : "HOLD";
}

function shouldRunTaSync(status: Awaited<ReturnType<typeof getAiSignalStatus>>): boolean {
  if (status.fresh && status.signal?.strategy !== AI_STRATEGY_TA_SYNC) {
    return false;
  }
  if (
    status.signal?.strategy === AI_STRATEGY_TA_SYNC &&
    status.ageMs != null &&
    status.ageMs < TA_SYNC_MIN_INTERVAL_MS
  ) {
    return false;
  }
  return !status.fresh;
}

/**
 * When the Python relay has not pushed recently, refresh a TA-based signal so
 * aiAssistMode is not stuck on a 9h-old worker payload and the UI is not stale.
 */
export async function refreshAiSignalFromTaIfStale(args: {
  instanceId: string;
  environment: BotEnvironment;
  symbol: string;
  side: "LONG" | "SHORT";
  smart: BotSmartConfig;
  maxAgeMs: number;
}): Promise<{ refreshed: boolean; source: "worker" | "ta_sync" | "none" }> {
  const status = await getAiSignalStatus(args.instanceId, args.maxAgeMs);
  if (status.fresh && status.signal) {
    const src =
      status.signal.strategy === AI_STRATEGY_TA_SYNC ? "ta_sync" : "worker";
    return { refreshed: false, source: src };
  }
  if (!shouldRunTaSync(status)) {
    const src =
      status.signal?.strategy === AI_STRATEGY_TA_SYNC ? "ta_sync" : "worker";
    return { refreshed: false, source: src };
  }

  const intent = args.side === "LONG" ? "long" : "short";
  const gate = await runSmartGate({
    environment: args.environment,
    symbol: args.symbol,
    market: "futures",
    smart: args.smart,
    intent,
  });

  const signal = gate.signal;
  const score = signal?.score ?? 0;
  const action = actionFromTa({
    side: args.side,
    gateOk: gate.ok,
    score,
  });
  const confidence = Math.min(100, Math.max(0, Math.abs(Math.round(score))));
  const summary = signal ? signalSummary(signal) : "TA sync";
  const reasons = [
    "TA sync — Python relay inactive; enable mcbuleli-ai-relay on Render",
    summary,
    ...(signal?.reasons?.slice(0, 4) ?? []),
  ];

  await storeAiSignal(args.instanceId, {
    version: 1,
    symbol: args.symbol,
    action,
    confidence,
    strategy: AI_STRATEGY_TA_SYNC,
    risk_level: confidence >= 55 ? "MEDIUM" : "LOW",
    timeframe: args.smart.timeframe,
    technical_score: score,
    combined_score: score,
    sentiment_score: 0,
    reasons,
    ts: new Date().toISOString(),
    x_position_action: "monitor",
    x_sentiment: undefined,
    x_reason: undefined,
  });

  return { refreshed: true, source: "ta_sync" };
}

export function aiSignalSource(
  strategy: string | undefined,
): "worker" | "ta_sync" | "none" {
  if (strategy === AI_STRATEGY_TA_SYNC) return "ta_sync";
  if (strategy) return "worker";
  return "none";
}
