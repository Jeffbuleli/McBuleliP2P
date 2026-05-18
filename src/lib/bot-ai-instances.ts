import { and, eq } from "drizzle-orm";
import { getDb, botInstances } from "@/db";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";

export type AiAssistInstanceRow = {
  instanceId: string;
  billing: "demo" | "live";
  symbol: string;
  side: "LONG" | "SHORT";
  timeframe: string;
  minAiConfidence: number;
};

/** Active futures bots with Python AI assist enabled (internal cron worker). */
export async function listAiAssistInstances(): Promise<AiAssistInstanceRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: botInstances.id,
      billing: botInstances.billing,
      config: botInstances.config,
    })
    .from(botInstances)
    .where(
      and(
        eq(botInstances.planId, "futures_um"),
        eq(botInstances.status, "active"),
      ),
    );

  const out: AiAssistInstanceRow[] = [];
  for (const row of rows) {
    const cfg = parseBotFuturesConfig(row.config);
    if (!cfg?.aiAssistMode) continue;
    out.push({
      instanceId: row.id,
      billing: row.billing as "demo" | "live",
      symbol: cfg.symbol,
      side: cfg.side,
      timeframe: cfg.timeframe,
      minAiConfidence: cfg.minAiConfidence,
    });
  }
  return out;
}
