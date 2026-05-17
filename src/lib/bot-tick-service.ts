import {
  appendBotExecutionLog,
  listActiveBotInstancesForTick,
} from "@/lib/bot-instance-service";
import { withBotCronLock } from "@/lib/bot-cron-lock";
import { tickDcaSpotInstance } from "@/lib/bot-engine-dca";
import { tickGridSpotInstance } from "@/lib/bot-engine-grid";
import { tickFuturesUmInstance } from "@/lib/bot-engine-futures";
import type { BotPlanId } from "@/lib/bot-config";

/** Skips that are normal between runs — not written to the user activity log. */
const SILENT_SKIP = new Set(["interval_not_elapsed", "position_open"]);

async function logTickSkip(
  inst: { id: string; userId: string; planId: string },
  skipped: string | undefined,
) {
  if (!skipped || SILENT_SKIP.has(skipped)) return;
  await appendBotExecutionLog({
    instanceId: inst.id,
    userId: inst.userId,
    planId: inst.planId as BotPlanId,
    action: "tick_skip",
    detail: { reason: skipped },
  });
}

export type BotTickResultRow = {
  instanceId: string;
  planId: string;
  userId: string;
  ran: boolean;
  skipped?: string;
};

export async function runBotsTick(): Promise<{
  instances: number;
  executed: number;
  skipped: number;
  errors: number;
  locked?: boolean;
  results: BotTickResultRow[];
}> {
  const lockedResult = await withBotCronLock(async () => {
    return runBotsTickUnlocked();
  });
  if (lockedResult === null) {
    return {
      instances: 0,
      executed: 0,
      skipped: 0,
      errors: 0,
      locked: true,
      results: [],
    };
  }
  return lockedResult;
}

async function runBotsTickUnlocked(): Promise<{
  instances: number;
  executed: number;
  skipped: number;
  errors: number;
  results: BotTickResultRow[];
}> {
  const instances = await listActiveBotInstancesForTick();
  let executed = 0;
  let skipped = 0;
  let errors = 0;
  const results: BotTickResultRow[] = [];

  for (const inst of instances) {
    try {
      let r: { ran: boolean; skipped?: string } | null = null;
      if (inst.planId === "dca_spot") {
        r = await tickDcaSpotInstance({
          instanceId: inst.id,
          userId: inst.userId,
          planId: inst.planId,
          billing: inst.billing,
          config: inst.config,
          lastExecutedAt: inst.lastExecutedAt,
        });
      } else if (inst.planId === "grid_spot") {
        r = await tickGridSpotInstance({
          instanceId: inst.id,
          userId: inst.userId,
          planId: inst.planId,
          billing: inst.billing,
          config: inst.config,
          lastExecutedAt: inst.lastExecutedAt,
        });
      } else if (inst.planId === "futures_um") {
        r = await tickFuturesUmInstance({
          instanceId: inst.id,
          userId: inst.userId,
          planId: inst.planId,
          billing: inst.billing,
          config: inst.config,
          lastExecutedAt: inst.lastExecutedAt,
        });
      } else {
        skipped += 1;
        results.push({
          instanceId: inst.id,
          planId: inst.planId,
          userId: inst.userId,
          ran: false,
          skipped: "unknown_plan",
        });
        continue;
      }

      if (!r) continue;
      if (!r.ran) await logTickSkip(inst, r.skipped);
      results.push({
        instanceId: inst.id,
        planId: inst.planId,
        userId: inst.userId,
        ran: r.ran,
        skipped: r.skipped,
      });
      if (r.ran) executed += 1;
      else skipped += 1;
    } catch {
      errors += 1;
      results.push({
        instanceId: inst.id,
        planId: inst.planId,
        userId: inst.userId,
        ran: false,
        skipped: "exception",
      });
    }
  }

  return {
    instances: instances.length,
    executed,
    skipped,
    errors,
    results,
  };
}
