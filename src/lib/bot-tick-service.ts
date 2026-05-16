import { listActiveBotInstancesForTick } from "@/lib/bot-instance-service";
import { tickDcaSpotInstance } from "@/lib/bot-engine-dca";
import { tickGridSpotInstance } from "@/lib/bot-engine-grid";
import { tickFuturesUmInstance } from "@/lib/bot-engine-futures";

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
