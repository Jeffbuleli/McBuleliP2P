import { and, eq } from "drizzle-orm";
import { getDb, botInstances } from "@/db";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import {
  listUserBinanceCredentials,
  loadUserBinanceCredentials,
} from "@/lib/bot-credentials-service";
import { resolveFuturesApiKind, type FuturesApiKind } from "@/lib/binance-futures-routing";
import { listFuturesOpenPositions } from "@/lib/bot-futures-positions";

export type AiAssistInstanceRow = {
  instanceId: string;
  userId: string;
  billing: "demo" | "live";
  symbol: string;
  side: "LONG" | "SHORT";
  timeframe: string;
  minAiConfidence: number;
  hasOpenPosition: boolean;
  openSide: "LONG" | "SHORT" | null;
};

/** Active futures bots with Python AI assist enabled (internal cron worker). */
export async function listAiAssistInstances(): Promise<AiAssistInstanceRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: botInstances.id,
      userId: botInstances.userId,
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

    const env = billingToKeyEnvironment(row.billing as "demo" | "live");
    let hasOpenPosition = false;
    let openSide: "LONG" | "SHORT" | null = null;

    try {
      const creds = await loadUserBinanceCredentials(row.userId, env);
      const credMeta = (await listUserBinanceCredentials(row.userId)).find(
        (c) => c.environment === env,
      );
      if (creds && credMeta?.futuresOk) {
        const kind: FuturesApiKind = await resolveFuturesApiKind(
          env,
          creds,
          credMeta.futuresApiKind,
        );
        const snaps = await listFuturesOpenPositions({
          environment: env,
          creds,
          apiKind: kind,
        });
        const onSymbol = snaps.find((p) => p.symbol === cfg.symbol);
        if (onSymbol) {
          hasOpenPosition = true;
          openSide = onSymbol.side;
        }
      }
    } catch {
      /* position probe failed — worker still runs without open context */
    }

    out.push({
      instanceId: row.id,
      userId: row.userId,
      billing: row.billing as "demo" | "live",
      symbol: cfg.symbol,
      side: cfg.side,
      timeframe: cfg.timeframe,
      minAiConfidence: cfg.minAiConfidence,
      hasOpenPosition,
      openSide,
    });
  }
  return out;
}
