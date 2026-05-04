import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, tradeFuturesPositions, users } from "@/db";
import {
  TRADE_BEGINNER_CLOSED_TRADES,
  TRADE_BEGINNER_MAX_LEVERAGE,
  TRADE_FEE_RATE,
  TRADE_LEVERAGES,
  TRADE_MAX_OPEN_FUTURES,
  TRADE_MIN_MARGIN_USDT,
  isTradeSymbol,
  tradeMaxMarginUsdt,
} from "@/lib/trade-config";
import {
  feeOnNotional,
  fmtTradeAmount,
  liquidationPrice,
  notionalUsdt,
  positionQtyBase,
  unrealizedPnlUsdt,
} from "@/lib/trade-math";
import { fetchSymbolTicker } from "@/lib/trade-price";
import { creditTradeDemoUsdt, debitTradeDemoUsdt } from "@/lib/trade-demo-balance";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { numFromNumeric } from "@/lib/wallet-types";

async function countClosedFutures(
  userId: string,
  isDemo: boolean,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        eq(tradeFuturesPositions.isDemo, isDemo),
      ),
    );
  return rows[0]?.c ?? 0;
}

export function maxLeverageForUser(closedTrades: number): number {
  if (closedTrades < TRADE_BEGINNER_CLOSED_TRADES) {
    return TRADE_BEGINNER_MAX_LEVERAGE;
  }
  return 10;
}

export async function processFuturesRisk(userId: string): Promise<void> {
  const db = getDb();
  const open = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "open"),
      ),
    );

  for (const p of open) {
    const t = await fetchSymbolTicker(p.symbol);
    if (!t) continue;
    const mark = t.lastPrice;
    const liq = numFromNumeric(p.liquidationPrice?.toString());
    const side = p.side === "short" ? "short" : "long";

    const crossedLiq =
      side === "long" ? mark <= liq + 1e-12 : mark >= liq - 1e-12;

    const sl = p.stopLossPrice
      ? numFromNumeric(p.stopLossPrice.toString())
      : null;
    const crossedSl =
      sl != null &&
      (side === "long" ? mark <= sl + 1e-12 : mark >= sl - 1e-12);

    const tp = p.takeProfitPrice
      ? numFromNumeric(p.takeProfitPrice.toString())
      : null;
    const crossedTp =
      tp != null &&
      (side === "long" ? mark >= tp - 1e-12 : mark <= tp + 1e-12);

    if (crossedLiq) {
      await closeFuturesPositionInternal(p.id, userId, mark, "liquidated");
    } else if (crossedSl) {
      await closeFuturesPositionInternal(p.id, userId, mark, "stop_loss");
    } else if (crossedTp) {
      await closeFuturesPositionInternal(p.id, userId, mark, "take_profit");
    }
  }
}

async function closeFuturesPositionInternal(
  positionId: string,
  userId: string,
  mark: number,
  reason: "manual" | "liquidated" | "stop_loss" | "take_profit",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const feeRate = TRADE_FEE_RATE;

  try {
    await db.transaction(async (tx) => {
      const [p] = await tx
        .select()
        .from(tradeFuturesPositions)
        .where(eq(tradeFuturesPositions.id, positionId))
        .limit(1);

      if (!p || p.userId !== userId || p.status !== "open") {
        throw new Error("invalid_position");
      }

      const margin = numFromNumeric(p.marginUsdt?.toString());
      const qty = numFromNumeric(p.qtyBase?.toString());
      const entry = numFromNumeric(p.entryPrice?.toString());
      const side = p.side === "short" ? "short" : "long";
      let unreal = unrealizedPnlUsdt({ side, qtyBase: qty, entry, mark });

      if (reason === "liquidated") {
        unreal = -margin;
      } else {
        const maxLoss = -margin;
        if (unreal < maxLoss) unreal = maxLoss;
      }

      const notionalClose = qty * mark;
      const feeClose = feeRate * notionalClose;
      const proceeds = margin + unreal - feeClose;
      const credit = Math.max(0, proceeds);
      const isDemo = Boolean(p.isDemo);

      await tx
        .update(tradeFuturesPositions)
        .set({
          status: reason === "liquidated" ? "liquidated" : "closed",
          closedAt: new Date(),
          closePrice: fmtTradeAmount(mark),
          realizedPnlUsdt: fmtTradeAmount(unreal - feeClose),
          feeCloseUsdt: fmtTradeAmount(feeClose),
          closeReason:
            reason === "take_profit"
              ? "take_profit"
              : reason === "stop_loss"
                ? "stop_loss"
                : reason === "liquidated"
                  ? "liquidated"
                  : "manual",
        })
        .where(eq(tradeFuturesPositions.id, positionId));

      if (credit > 1e-18) {
        if (isDemo) {
          await creditTradeDemoUsdt(tx, userId, fmtTradeAmount(credit));
        } else {
          await creditUserAsset(tx, userId, "USDT", fmtTradeAmount(credit));
        }
      }

      if (!isDemo) {
        const batchId = randomUUID();
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId,
            entryType:
              reason === "liquidated"
                ? "trade_futures_liquidated"
                : "trade_futures_close",
            asset: "USDT",
            amount: fmtTradeAmount(credit),
            meta: {
              positionId,
              mark,
              unrealized: unreal,
              feeClose,
              reason,
            },
          },
        ]);
      }
    });

    return { ok: true };
  } catch {
    return { ok: false, message: "trade_close_failed" };
  }
}

export async function listFuturesPositions(
  userId: string,
  mode: "demo" | "live",
): Promise<{
  positions: Array<{
    id: string;
    symbol: string;
    side: string;
    leverage: number;
    marginUsdt: string;
    entryPrice: string;
    liquidationPrice: string;
    stopLossPrice: string | null;
    takeProfitPrice: string | null;
    qtyBase: string;
    status: string;
    unrealizedPnlUsdt: number;
    markPrice: number;
    openedAt: string;
  }>;
  maxLeverage: number;
}> {
  const isDemo = mode === "demo";
  await processFuturesRisk(userId);

  const db = getDb();
  const closed = await countClosedFutures(userId, isDemo);
  const maxLev = maxLeverageForUser(closed);

  const rows = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, isDemo),
      ),
    )
    .orderBy(desc(tradeFuturesPositions.openedAt))
    .limit(50);

  const positions = [];
  for (const p of rows) {
    const t = await fetchSymbolTicker(p.symbol);
    const mark = t?.lastPrice ?? 0;
    const qty = numFromNumeric(p.qtyBase?.toString());
    const entry = numFromNumeric(p.entryPrice?.toString());
    const side = p.side === "short" ? "short" : "long";
    let unreal = unrealizedPnlUsdt({ side, qtyBase: qty, entry, mark });
    const margin = numFromNumeric(p.marginUsdt?.toString());
    if (unreal < -margin) unreal = -margin;

    positions.push({
      id: p.id,
      symbol: p.symbol,
      side: p.side,
      leverage: p.leverage,
      marginUsdt: p.marginUsdt?.toString() ?? "0",
      entryPrice: p.entryPrice?.toString() ?? "0",
      liquidationPrice: p.liquidationPrice?.toString() ?? "0",
      stopLossPrice: p.stopLossPrice?.toString() ?? null,
      takeProfitPrice: p.takeProfitPrice?.toString() ?? null,
      qtyBase: p.qtyBase?.toString() ?? "0",
      status: p.status,
      unrealizedPnlUsdt: unreal,
      markPrice: mark,
      openedAt: p.openedAt.toISOString(),
    });
  }

  return { positions, maxLeverage: maxLev };
}

export async function listFuturesHistory(
  userId: string,
  mode: "demo" | "live",
  limit = 30,
): Promise<{
  trades: Array<{
    id: string;
    symbol: string;
    side: string;
    leverage: number;
    marginUsdt: string;
    entryPrice: string;
    closePrice: string;
    realizedPnlUsdt: string;
    feeOpenUsdt: string;
    feeCloseUsdt: string;
    stopLossPrice: string | null;
    takeProfitPrice: string | null;
    closeReason: string | null;
    openedAt: string;
    closedAt: string;
  }>;
}> {
  const isDemo = mode === "demo";
  await processFuturesRisk(userId);

  const db = getDb();
  const rows = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        eq(tradeFuturesPositions.isDemo, isDemo),
      ),
    )
    .orderBy(desc(tradeFuturesPositions.closedAt))
    .limit(Math.max(1, Math.min(100, Math.floor(limit))));

  const trades = rows
    .filter((r) => r.closedAt != null && r.closePrice != null && r.realizedPnlUsdt != null)
    .map((r) => ({
      id: r.id,
      symbol: r.symbol,
      side: r.side,
      leverage: r.leverage,
      marginUsdt: r.marginUsdt?.toString() ?? "0",
      entryPrice: r.entryPrice?.toString() ?? "0",
      closePrice: r.closePrice?.toString() ?? "0",
      realizedPnlUsdt: r.realizedPnlUsdt?.toString() ?? "0",
      feeOpenUsdt: r.feeOpenUsdt?.toString() ?? "0",
      feeCloseUsdt: r.feeCloseUsdt?.toString() ?? "0",
      stopLossPrice: r.stopLossPrice?.toString() ?? null,
      takeProfitPrice: r.takeProfitPrice?.toString() ?? null,
      closeReason: r.closeReason ?? null,
      openedAt: r.openedAt.toISOString(),
      closedAt: r.closedAt!.toISOString(),
    }));

  return { trades };
}

export async function openFuturesPosition(args: {
  userId: string;
  mode: "demo" | "live";
  symbol: string;
  side: "long" | "short";
  leverage: number;
  marginUsdt: number;
  stopLossPrice?: number | null;
  takeProfitPrice?: number | null;
}): Promise<
  { ok: true; positionId: string } | { ok: false; message: string }
> {
  await processFuturesRisk(args.userId);

  const {
    userId,
    mode,
    symbol,
    side,
    leverage: levRaw,
    marginUsdt: marginIn,
    stopLossPrice,
    takeProfitPrice,
  } = args;
  const isDemo = mode === "demo";

  if (!isDemo) {
    const dbCheck = getDb();
    const [row] = await dbCheck
      .select({ tradeLiveEnabled: users.tradeLiveEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row?.tradeLiveEnabled) {
      return { ok: false, message: "trade_live_not_enabled" };
    }
  }

  if (!isTradeSymbol(symbol)) {
    return { ok: false, message: "trade_invalid_symbol" };
  }
  if (!TRADE_LEVERAGES.includes(levRaw as 2 | 5 | 10)) {
    return { ok: false, message: "trade_invalid_leverage" };
  }
  const closed = await countClosedFutures(userId, isDemo);
  const maxLev = maxLeverageForUser(closed);
  if (levRaw > maxLev) {
    return { ok: false, message: "trade_leverage_capped_beginner" };
  }

  const marginUsdt = marginIn;
  if (
    !Number.isFinite(marginUsdt) ||
    marginUsdt < TRADE_MIN_MARGIN_USDT ||
    marginUsdt > tradeMaxMarginUsdt()
  ) {
    return { ok: false, message: "trade_invalid_margin" };
  }

  const db = getDb();
  const openCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, isDemo),
      ),
    );
  if ((openCount[0]?.c ?? 0) >= TRADE_MAX_OPEN_FUTURES) {
    return { ok: false, message: "trade_max_positions" };
  }

  const ticker = await fetchSymbolTicker(symbol);
  if (!ticker) {
    return { ok: false, message: "trade_price_unavailable" };
  }
  const entry = ticker.lastPrice;
  const liq = liquidationPrice({ entry, side, leverage: levRaw });
  const qty = positionQtyBase(marginUsdt, levRaw, entry);
  const notional = notionalUsdt(marginUsdt, levRaw);
  const feeOpen = feeOnNotional(notional);

  if (stopLossPrice != null && Number.isFinite(stopLossPrice)) {
    if (side === "long" && stopLossPrice >= entry) {
      return { ok: false, message: "trade_invalid_stop" };
    }
    if (side === "short" && stopLossPrice <= entry) {
      return { ok: false, message: "trade_invalid_stop" };
    }
  }

  if (takeProfitPrice != null && Number.isFinite(takeProfitPrice)) {
    if (side === "long") {
      if (takeProfitPrice <= entry) {
        return { ok: false, message: "trade_invalid_tp" };
      }
      if (
        stopLossPrice != null &&
        Number.isFinite(stopLossPrice) &&
        !(stopLossPrice < entry && takeProfitPrice > entry)
      ) {
        return { ok: false, message: "trade_invalid_tp" };
      }
    } else {
      if (takeProfitPrice >= entry) {
        return { ok: false, message: "trade_invalid_tp" };
      }
      if (
        stopLossPrice != null &&
        Number.isFinite(stopLossPrice) &&
        !(takeProfitPrice < entry && stopLossPrice > entry)
      ) {
        return { ok: false, message: "trade_invalid_tp" };
      }
    }
  }

  const totalDebit = marginUsdt + feeOpen;
  const batchId = randomUUID();

  try {
    const positionId = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({
          balance: users.balance,
          tradeDemoUsdtBalance: users.tradeDemoUsdtBalance,
          tradeLiveEnabled: users.tradeLiveEnabled,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!u) throw new Error("user");
      if (isDemo) {
        const bal = numFromNumeric(u.tradeDemoUsdtBalance?.toString());
        if (bal + 1e-18 < totalDebit) {
          throw new Error("insufficient");
        }
        await debitTradeDemoUsdt(tx, userId, fmtTradeAmount(totalDebit));
      } else {
        if (!u.tradeLiveEnabled) throw new Error("live_disabled");
        const bal = numFromNumeric(u.balance?.toString());
        if (bal + 1e-18 < totalDebit) {
          throw new Error("insufficient");
        }
        await debitUserAsset(tx, userId, "USDT", fmtTradeAmount(totalDebit));
      }

      const inserted = await tx
        .insert(tradeFuturesPositions)
        .values({
          userId,
          symbol,
          side,
          leverage: levRaw,
          marginUsdt: fmtTradeAmount(marginUsdt),
          entryPrice: fmtTradeAmount(entry),
          liquidationPrice: fmtTradeAmount(liq),
          stopLossPrice:
            stopLossPrice != null && Number.isFinite(stopLossPrice)
              ? fmtTradeAmount(stopLossPrice)
              : null,
          takeProfitPrice:
            takeProfitPrice != null && Number.isFinite(takeProfitPrice)
              ? fmtTradeAmount(takeProfitPrice)
              : null,
          qtyBase: fmtTradeAmount(qty),
          feeOpenUsdt: fmtTradeAmount(feeOpen),
          status: "open",
          isDemo,
          meta: { batchOpen: batchId },
        })
        .returning({ id: tradeFuturesPositions.id });

      const ins = inserted[0];
      if (!isDemo) {
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId,
            entryType: "trade_futures_open",
            asset: "USDT",
            amount: `-${fmtTradeAmount(totalDebit)}`,
            meta: {
              symbol,
              side,
              leverage: levRaw,
              margin: marginUsdt,
              feeOpen,
            },
          },
        ]);
      }

      return ins?.id ?? "";
    });

    if (!positionId) return { ok: false, message: "trade_open_failed" };
    return { ok: true, positionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") return { ok: false, message: "trade_insufficient_usdt" };
    if (msg === "live_disabled")
      return { ok: false, message: "trade_live_not_enabled" };
    return { ok: false, message: "trade_open_failed" };
  }
}

export async function closeFuturesPosition(args: {
  userId: string;
  positionId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [p] = await db
    .select()
    .from(tradeFuturesPositions)
    .where(eq(tradeFuturesPositions.id, args.positionId))
    .limit(1);

  if (!p || p.userId !== args.userId || p.status !== "open") {
    return { ok: false, message: "trade_invalid_position" };
  }

  const t = await fetchSymbolTicker(p.symbol);
  if (!t) return { ok: false, message: "trade_price_unavailable" };

  return closeFuturesPositionInternal(args.positionId, args.userId, t.lastPrice, "manual");
}

export async function updateFuturesSlTp(args: {
  userId: string;
  positionId: string;
  stopLossPrice?: number | null;
  takeProfitPrice?: number | null;
}): Promise<
  | { ok: true; stopLossPrice: string | null; takeProfitPrice: string | null }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [p] = await db
    .select()
    .from(tradeFuturesPositions)
    .where(eq(tradeFuturesPositions.id, args.positionId))
    .limit(1);

  if (!p || p.userId !== args.userId || p.status !== "open") {
    return { ok: false, message: "trade_invalid_position" };
  }

  const t = await fetchSymbolTicker(p.symbol);
  if (!t) return { ok: false, message: "trade_price_unavailable" };
  const mark = t.lastPrice;
  if (!Number.isFinite(mark) || mark <= 0) {
    return { ok: false, message: "trade_price_unavailable" };
  }

  const side = p.side === "short" ? "short" : "long";

  const slIn = args.stopLossPrice;
  const tpIn = args.takeProfitPrice;

  const hasAny = args.stopLossPrice !== undefined || args.takeProfitPrice !== undefined;
  if (!hasAny) return { ok: false, message: "trade_invalid_body" };

  const sl =
    slIn == null
      ? null
      : Number.isFinite(slIn) && slIn > 0
        ? slIn
        : NaN;
  const tp =
    tpIn == null
      ? null
      : Number.isFinite(tpIn) && tpIn > 0
        ? tpIn
        : NaN;

  if (Number.isNaN(sl) || Number.isNaN(tp)) {
    return { ok: false, message: "trade_invalid_body" };
  }

  // Allow protecting gains: SL can be beyond entry, but must be on the safe side of *current* mark.
  if (sl != null) {
    if (side === "long" && sl >= mark) return { ok: false, message: "trade_invalid_stop" };
    if (side === "short" && sl <= mark) return { ok: false, message: "trade_invalid_stop" };
  }
  if (tp != null) {
    if (side === "long" && tp <= mark) return { ok: false, message: "trade_invalid_tp" };
    if (side === "short" && tp >= mark) return { ok: false, message: "trade_invalid_tp" };
  }
  if (sl != null && tp != null) {
    if (side === "long" && !(sl < tp)) return { ok: false, message: "trade_invalid_tp" };
    if (side === "short" && !(tp < sl)) return { ok: false, message: "trade_invalid_tp" };
  }

  const nextSl = sl == null ? null : fmtTradeAmount(sl);
  const nextTp = tp == null ? null : fmtTradeAmount(tp);

  await db
    .update(tradeFuturesPositions)
    .set({
      stopLossPrice: nextSl,
      takeProfitPrice: nextTp,
    })
    .where(eq(tradeFuturesPositions.id, args.positionId));

  return { ok: true, stopLossPrice: nextSl, takeProfitPrice: nextTp };
}
