import { listActiveBotInstancesForTick } from "@/lib/bot-instance-service";
import { tickDcaSpotInstance } from "@/lib/bot-engine-dca";
import { tickGridSpotInstance } from "@/lib/bot-engine-grid";

export async function runBotsTick(): Promise<{
  instances: number;
  executed: number;
  skipped: number;
  errors: number;
}> {
  const instances = await listActiveBotInstancesForTick();
  let executed = 0;
  let skipped = 0;
  let errors = 0;

  for (const inst of instances) {
    try {
      if (inst.planId === "dca_spot") {
        const r = await tickDcaSpotInstance({
          instanceId: inst.id,
          userId: inst.userId,
          planId: inst.planId,
          billing: inst.billing,
          config: inst.config,
          lastExecutedAt: inst.lastExecutedAt,
        });
        if (r.ran) executed += 1;
        else skipped += 1;
        continue;
      }
      if (inst.planId === "grid_spot") {
        const r = await tickGridSpotInstance({
          instanceId: inst.id,
          userId: inst.userId,
          planId: inst.planId,
          billing: inst.billing,
          config: inst.config,
          lastExecutedAt: inst.lastExecutedAt,
        });
        if (r.ran) executed += 1;
        else skipped += 1;
        continue;
      }
      skipped += 1;
    } catch {
      errors += 1;
    }
  }

  return {
    instances: instances.length,
    executed,
    skipped,
    errors,
  };
}
