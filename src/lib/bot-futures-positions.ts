import type { BotEnvironment } from "@/lib/bot-config";
import type { StoredBinanceCredentials } from "@/lib/bot-keys-crypto";
import {
  futuresSignedGet,
  type FuturesApiKind,
} from "@/lib/binance-futures-routing";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";

type PositionRisk = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice?: string;
  unRealizedProfit?: string;
};

export type FuturesOpenSnapshot = {
  symbol: string;
  side: "LONG" | "SHORT";
  size: string;
  entryPrice: string;
  markPrice?: string;
  unrealizedPnl?: string;
  amt: number;
  entry: number;
};

export async function listFuturesOpenPositions(args: {
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  apiKind: FuturesApiKind;
}): Promise<FuturesOpenSnapshot[]> {
  const raw = (await futuresSignedGet({
    environment: args.environment,
    creds: args.creds,
    kind: args.apiKind,
    pathKey: "positionRisk",
  })) as PositionRisk[];

  const out: FuturesOpenSnapshot[] = [];
  for (const row of raw) {
    const amt = Number(row.positionAmt);
    if (!Number.isFinite(amt) || Math.abs(amt) < 1e-12) continue;
    out.push({
      symbol: row.symbol,
      side: amt > 0 ? "LONG" : "SHORT",
      size: String(Math.abs(amt)),
      entryPrice: row.entryPrice,
      markPrice: row.markPrice,
      unrealizedPnl: row.unRealizedProfit,
      amt,
      entry: Number(row.entryPrice),
    });
  }
  return out;
}

export function futuresSnapshotsToOpenRows(
  snaps: FuturesOpenSnapshot[],
  configSymbol: string,
): BotOpenPositionRow[] {
  return snaps.map((s) => ({
    kind: "futures" as const,
    symbol: s.symbol,
    side: s.side,
    size: s.size,
    entryPrice: s.entryPrice,
    markPrice: s.markPrice,
    unrealizedPnl: s.unrealizedPnl,
    matchesConfig: s.symbol === configSymbol,
  }));
}

export function findOtherFuturesOpen(
  snaps: FuturesOpenSnapshot[],
  configSymbol: string,
): FuturesOpenSnapshot | undefined {
  return snaps.find((s) => s.symbol !== configSymbol);
}
