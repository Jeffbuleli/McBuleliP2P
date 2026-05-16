import { and, desc, eq } from "drizzle-orm";
import { getDb, botInstances, botExecutionLog } from "@/db";
import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { parseBotDcaConfig } from "@/lib/bot-dca-config";

export type BotInstanceRow = {
  id: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  status: "active" | "paused";
  config: Record<string, unknown>;
  lastExecutedAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export async function listUserBotInstances(
  userId: string,
): Promise<BotInstanceRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(botInstances)
    .where(eq(botInstances.userId, userId))
    .orderBy(desc(botInstances.updatedAt));
  return rows.map((r) => ({
    id: r.id,
    planId: r.planId as BotPlanId,
    billing: r.billing as BotBillingMode,
    status: r.status as "active" | "paused",
    config: (r.config ?? {}) as Record<string, unknown>,
    lastExecutedAt: r.lastExecutedAt?.toISOString() ?? null,
    lastError: r.lastError,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function upsertBotInstance(args: {
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  status: "active" | "paused";
  config: Record<string, unknown>;
}): Promise<BotInstanceRow> {
  const now = new Date();
  const db = getDb();
  const [row] = await db
    .insert(botInstances)
    .values({
      userId: args.userId,
      planId: args.planId,
      billing: args.billing,
      status: args.status,
      config: args.config,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [botInstances.userId, botInstances.planId],
      set: {
        billing: args.billing,
        status: args.status,
        config: args.config,
        updatedAt: now,
      },
    })
    .returning();

  return {
    id: row.id,
    planId: row.planId as BotPlanId,
    billing: row.billing as BotBillingMode,
    status: row.status as "active" | "paused",
    config: (row.config ?? {}) as Record<string, unknown>,
    lastExecutedAt: row.lastExecutedAt?.toISOString() ?? null,
    lastError: row.lastError,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listActiveBotInstancesForTick(): Promise<
  Array<{
    id: string;
    userId: string;
    planId: BotPlanId;
    billing: BotBillingMode;
    config: Record<string, unknown>;
    lastExecutedAt: Date | null;
  }>
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(botInstances)
    .where(eq(botInstances.status, "active"));
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    planId: r.planId as BotPlanId,
    billing: r.billing as BotBillingMode,
    config: (r.config ?? {}) as Record<string, unknown>,
    lastExecutedAt: r.lastExecutedAt,
  }));
}

export async function markBotInstanceExecuted(
  instanceId: string,
  error: string | null,
) {
  const db = getDb();
  await db
    .update(botInstances)
    .set({
      lastExecutedAt: new Date(),
      lastError: error,
      updatedAt: new Date(),
    })
    .where(eq(botInstances.id, instanceId));
}

export async function appendBotExecutionLog(args: {
  instanceId: string;
  userId: string;
  planId: BotPlanId;
  action: string;
  detail?: Record<string, unknown> | null;
}) {
  const db = getDb();
  await db.insert(botExecutionLog).values({
    instanceId: args.instanceId,
    userId: args.userId,
    planId: args.planId,
    action: args.action,
    detail: args.detail ?? null,
  });
}

export function validateInstanceConfig(
  planId: BotPlanId,
  config: Record<string, unknown>,
): { ok: true } | { ok: false; message: string } {
  if (planId === "dca_spot") {
    if (!parseBotDcaConfig(config)) {
      return { ok: false, message: "bots_invalid_dca_config" };
    }
    return { ok: true };
  }
  return { ok: false, message: "bots_strategy_not_implemented" };
}
