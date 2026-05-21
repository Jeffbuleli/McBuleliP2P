import { appendBotExecutionLog } from "@/lib/bot-instance-service";
import type { BotPlanId } from "@/lib/bot-config";
import { signalSummary } from "@/lib/bot-intelligence";
import type { IgnoredSignalTrace } from "@/lib/bot-decision/types";
import type { TechnicalEngineOutput } from "@/lib/bot-decision/types";

export async function appendDecisionSkipLog(args: {
  instanceId: string;
  userId: string;
  planId: BotPlanId;
  trace: IgnoredSignalTrace;
  technical?: TechnicalEngineOutput;
  minRequired?: number;
  plan?: "dca" | "grid" | "futures";
}): Promise<void> {
  const t = args.technical;
  await appendBotExecutionLog({
    instanceId: args.instanceId,
    userId: args.userId,
    planId: args.planId,
    action: "decision_skip",
    detail: {
      trace: args.trace,
      plan: args.plan,
      score: args.trace.score,
      minRequired: args.minRequired,
      summary: t ? signalSummary(t.tradeSignal) : null,
      technical: t
        ? {
            signal: t.signal,
            confidence: t.confidence,
            regime: t.market_regime,
          }
        : null,
    },
  });
}
