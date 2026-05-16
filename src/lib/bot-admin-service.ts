import { and, desc, eq, gt, sql } from "drizzle-orm";
import {
  getDb,
  botExecutionLog,
  botInstances,
  botSubscriptions,
  users,
} from "@/db";
import type { BotPlanId } from "@/lib/bot-config";

export type AdminBotsOverview = {
  activeSubscriptions: number;
  activeInstances: number;
  subscribers: number;
  recentSubscriptions: Array<{
    id: string;
    email: string;
    planId: string;
    billing: string;
    pricePaid: string;
    expiresAt: string;
  }>;
  recentLogs: Array<{
    id: string;
    email: string;
    planId: string;
    action: string;
    createdAt: string;
  }>;
  byPlan: Record<string, number>;
};

export async function getAdminBotsOverview(): Promise<AdminBotsOverview> {
  const db = getDb();
  const now = new Date();

  const [subCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.status, "active"),
        gt(botSubscriptions.expiresAt, now),
      ),
    );

  const [instCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(botInstances)
    .where(eq(botInstances.status, "active"));

  const [subscriberCount] = await db
    .select({
      n: sql<number>`count(distinct ${botSubscriptions.userId})::int`,
    })
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.status, "active"),
        gt(botSubscriptions.expiresAt, now),
      ),
    );

  const planRows = await db
    .select({
      planId: botSubscriptions.planId,
      n: sql<number>`count(*)::int`,
    })
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.status, "active"),
        gt(botSubscriptions.expiresAt, now),
      ),
    )
    .groupBy(botSubscriptions.planId);

  const byPlan: Record<string, number> = {};
  for (const r of planRows) {
    byPlan[r.planId] = r.n;
  }

  const recentSubscriptions = await db
    .select({
      id: botSubscriptions.id,
      email: users.email,
      planId: botSubscriptions.planId,
      billing: botSubscriptions.billing,
      pricePaid: botSubscriptions.pricePaid,
      expiresAt: botSubscriptions.expiresAt,
    })
    .from(botSubscriptions)
    .innerJoin(users, eq(botSubscriptions.userId, users.id))
    .orderBy(desc(botSubscriptions.createdAt))
    .limit(25);

  const recentLogs = await db
    .select({
      id: botExecutionLog.id,
      email: users.email,
      planId: botExecutionLog.planId,
      action: botExecutionLog.action,
      createdAt: botExecutionLog.createdAt,
    })
    .from(botExecutionLog)
    .innerJoin(users, eq(botExecutionLog.userId, users.id))
    .orderBy(desc(botExecutionLog.createdAt))
    .limit(40);

  return {
    activeSubscriptions: subCount?.n ?? 0,
    activeInstances: instCount?.n ?? 0,
    subscribers: subscriberCount?.n ?? 0,
    byPlan,
    recentSubscriptions: recentSubscriptions.map((r) => ({
      id: r.id,
      email: r.email,
      planId: r.planId,
      billing: r.billing,
      pricePaid: r.pricePaid.toString(),
      expiresAt: r.expiresAt.toISOString(),
    })),
    recentLogs: recentLogs.map((r) => ({
      id: r.id,
      email: r.email,
      planId: r.planId,
      action: r.action,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
