import { and, desc, eq } from "drizzle-orm";
import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { getDb, botExecutionLog, botInstances } from "@/db";

const TRADE_ACTIONS = new Set([
  "dca_buy",
  "grid_refresh",
  "futures_open",
]);

const CLOSE_ACTIONS = new Set([
  "futures_sl_close",
  "futures_tp_close",
  "futures_smart_close",
  "futures_trailing_close",
  "futures_max_hold_close",
]);

const SKIP_ACTIONS = new Set(["tick_skip", "decision_skip", "smart_skip", "ai_skip"]);

export type BotInstanceStats = {
  runtimeDays: number;
  tradeCount: number;
  volumeUsdt: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  avgClosePnlPct: number | null;
  skipCount: number;
  errorCount: number;
  lastTradeAt: string | null;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function closeOutcome(detail: Record<string, unknown> | null): "win" | "loss" | null {
  if (!detail) return null;
  const profitPct = num(detail.profitPct);
  if (profitPct != null) {
    if (profitPct > 0.05) return "win";
    if (profitPct < -0.05) return "loss";
    return null;
  }
  const entry = num(detail.entry);
  const mark = num(detail.mark);
  if (entry == null || mark == null || entry <= 0) return null;
  const pct = ((mark - entry) / entry) * 100;
  if (pct > 0.1) return "win";
  if (pct < -0.1) return "loss";
  return null;
}

export async function getBotInstanceStats(args: {
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
}): Promise<BotInstanceStats | null> {
  const db = getDb();
  const [inst] = await db
    .select({
      id: botInstances.id,
      createdAt: botInstances.createdAt,
    })
    .from(botInstances)
    .where(
      and(
        eq(botInstances.userId, args.userId),
        eq(botInstances.planId, args.planId),
        eq(botInstances.billing, args.billing),
      ),
    )
    .limit(1);

  if (!inst) return null;

  const logs = await db
    .select({
      action: botExecutionLog.action,
      detail: botExecutionLog.detail,
      createdAt: botExecutionLog.createdAt,
    })
    .from(botExecutionLog)
    .where(eq(botExecutionLog.instanceId, inst.id))
    .orderBy(desc(botExecutionLog.createdAt))
    .limit(500);

  let tradeCount = 0;
  let volumeUsdt = 0;
  let winCount = 0;
  let lossCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let lastTradeAt: string | null = null;
  const closePnlPcts: number[] = [];

  for (const row of logs) {
    const detail = (row.detail ?? {}) as Record<string, unknown>;
    if (row.action === "error") {
      errorCount += 1;
      continue;
    }
    if (SKIP_ACTIONS.has(row.action)) {
      skipCount += 1;
      continue;
    }
    if (TRADE_ACTIONS.has(row.action)) {
      tradeCount += 1;
      if (!lastTradeAt) lastTradeAt = row.createdAt.toISOString();
      const quote =
        num(detail.quoteAmountUsdt) ??
        num(detail.quotePerGrid) ??
        num(detail.marginUsdt);
      if (quote != null) volumeUsdt += quote;
      continue;
    }
    if (CLOSE_ACTIONS.has(row.action)) {
      const outcome = closeOutcome(detail);
      if (outcome === "win") winCount += 1;
      if (outcome === "loss") lossCount += 1;
      const profitPct = num(detail.profitPct);
      if (profitPct != null) closePnlPcts.push(profitPct);
      else {
        const entry = num(detail.entry);
        const mark = num(detail.mark);
        if (entry != null && mark != null && entry > 0) {
          closePnlPcts.push(((mark - entry) / entry) * 100);
        }
      }
    }
  }

  const closed = winCount + lossCount;
  const runtimeMs = Date.now() - inst.createdAt.getTime();

  return {
    runtimeDays: Math.max(0, Math.floor(runtimeMs / (24 * 60 * 60 * 1000))),
    tradeCount,
    volumeUsdt: Math.round(volumeUsdt * 100) / 100,
    winCount,
    lossCount,
    winRate: closed > 0 ? Math.round((winCount / closed) * 1000) / 10 : null,
    avgClosePnlPct:
      closePnlPcts.length > 0
        ? Math.round(
            (closePnlPcts.reduce((a, b) => a + b, 0) / closePnlPcts.length) * 100,
          ) / 100
        : null,
    skipCount,
    errorCount,
    lastTradeAt,
  };
}
