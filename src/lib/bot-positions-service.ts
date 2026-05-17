import type { BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment, type BotBillingMode } from "@/lib/bot-config";
import {
  listUserBinanceCredentials,
  loadUserBinanceCredentials,
} from "@/lib/bot-credentials-service";
import { binanceUserSignedGet } from "@/lib/binance-user-client";
import {
  futuresSignedGet,
  resolveFuturesApiKind,
} from "@/lib/binance-futures-routing";
import { parseBotDcaConfig } from "@/lib/bot-dca-config";
import { parseBotGridConfig } from "@/lib/bot-grid-config";
import { parseBotFuturesConfig } from "@/lib/bot-futures-config";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";

export type { BotOpenPositionRow } from "@/lib/bot-positions-types";

type PositionRisk = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice?: string;
  unRealizedProfit?: string;
};

type OpenOrder = {
  symbol: string;
  side: string;
  price: string;
  origQty: string;
  status: string;
};

type Balance = {
  asset: string;
  free: string;
};

export async function fetchBotOpenPositions(args: {
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  config: Record<string, unknown>;
}): Promise<{ open: BotOpenPositionRow[]; error?: string }> {
  const env = billingToKeyEnvironment(args.billing);
  const creds = await loadUserBinanceCredentials(args.userId, env);
  if (!creds) {
    return { open: [], error: "bots_err_no_keys" };
  }

  const credMeta = (await listUserBinanceCredentials(args.userId)).find(
    (c) => c.environment === env,
  );

  try {
    if (args.planId === "futures_um") {
      const cfg = parseBotFuturesConfig(args.config);
      if (!cfg) return { open: [] };
      const apiKind = await resolveFuturesApiKind(
        env,
        creds,
        credMeta?.futuresApiKind,
      );
      const raw = (await futuresSignedGet({
        environment: env,
        creds,
        kind: apiKind,
        pathKey: "positionRisk",
        params: { symbol: cfg.symbol },
      })) as PositionRisk[];
      const row = raw.find((p) => p.symbol === cfg.symbol);
      const amt = row ? Number(row.positionAmt) : 0;
      if (!row || !Number.isFinite(amt) || Math.abs(amt) < 1e-8) {
        return { open: [] };
      }
      return {
        open: [
          {
            kind: "futures",
            symbol: cfg.symbol,
            side: amt > 0 ? "LONG" : "SHORT",
            size: String(Math.abs(amt)),
            entryPrice: row.entryPrice,
            markPrice: row.markPrice,
            unrealizedPnl: row.unRealizedProfit,
          },
        ],
      };
    }

    if (args.planId === "grid_spot") {
      const cfg = parseBotGridConfig(args.config);
      if (!cfg) return { open: [] };
      const orders = (await binanceUserSignedGet({
        environment: env,
        creds,
        market: "spot",
        path: "/api/v3/openOrders",
        params: { symbol: cfg.symbol },
      })) as OpenOrder[];
      return {
        open: orders.map((o) => ({
          kind: "spot_order" as const,
          symbol: o.symbol,
          side: o.side,
          price: o.price,
          quantity: o.origQty,
          notionalUsdt: String(
            Number(o.price) * Number(o.origQty) || 0,
          ),
        })),
      };
    }

    const cfg = parseBotDcaConfig(args.config);
    if (!cfg) return { open: [] };
    const base = cfg.symbol.replace(/USDT$/i, "");
    const balances = (await binanceUserSignedGet({
      environment: env,
      creds,
      market: "spot",
      path: "/api/v3/account",
    })) as { balances?: Balance[] };
    const bal = balances.balances?.find((b) => b.asset === base);
    const free = bal ? Number(bal.free) : 0;
    if (!Number.isFinite(free) || free < 1e-8) {
      return { open: [] };
    }
    return {
      open: [
        {
          kind: "spot_holding",
          symbol: cfg.symbol,
          side: "HOLD",
          size: bal!.free,
          quantity: bal!.free,
        },
      ],
    };
  } catch {
    return { open: [], error: "bots_positions_fetch_failed" };
  }
}
