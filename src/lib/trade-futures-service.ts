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
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { numFromNumeric } from "@/lib/wallet-types";

async function countClosedFutures(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
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

    if (crossedLiq) {
      await closeFuturesPositionInternal(p.id, userId, mark, "liquidated");
    } else if (crossedSl) {
      await closeFuturesPositionInternal(p.id, userId, mark, "stop_loss");
    }
  }
}

async function closeFuturesPositionInternal(
  positionId: string,
  userId: string,
  mark: number,
  reason: "manual" | "liquidated" | "stop_loss",
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

      await tx
        .update(tradeFuturesPositions)
        .set({
          status: reason === "liquidated" ? "liquidated" : "closed",
          closedAt: new Date(),
          closePrice: fmtTradeAmount(mark),
          realizedPnlUsdt: fmtTradeAmount(unreal - feeClose),
          feeCloseUsdt: fmtTradeAmount(feeClose),
          closeReason: reason,
        })
        .where(eq(tradeFuturesPositions.id, positionId));

      if (credit > 1e-18) {
        await creditUserAsset(tx, userId, "USDT", fmtTradeAmount(credit));
      }

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
    });

    return { ok: true };
  } catch {
    return { ok: false, message: "trade_close_failed" };
  }
}

export async function listFuturesPositions(userId: string): Promise<{
  positions: Array<{
    id: string;
    symbol: string;
    side: string;
    leverage: number;
    marginUsdt: string;
    entryPrice: string;
    liquidationPrice: string;
    stopLossPrice: string | null;
    qtyBase: string;
    status: string;
    unrealizedPnlUsdt: number;
    markPrice: number;
    openedAt: string;
  }>;
  maxLeverage: number;
}> {
  await processFuturesRisk(userId);

  const db = getDb();
  const closed = await countClosedFutures(userId);
  const maxLev = maxLeverageForUser(closed);

  const rows = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, userId),
        eq(tradeFuturesPositions.status, "open"),
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
      qtyBase: p.qtyBase?.toString() ?? "0",
      status: p.status,
      unrealizedPnlUsdt: unreal,
      markPrice: mark,
      openedAt: p.openedAt.toISOString(),
    });
  }

  return { positions, maxLeverage: maxLev };
}

export async function openFuturesPosition(args: {
  userId: string;
  symbol: string;
  side: "long" | "short";
  leverage: number;
  marginUsdt: number;
  stopLossPrice?: number | null;
}): Promise<
  { ok: true; positionId: string } | { ok: false; message: string }
> {
  await processFuturesRisk(args.userId);

  const {
    userId,
    symbol,
    side,
    leverage: levRaw,
    marginUsdt: marginIn,
    stopLossPrice,
  } = args;

  if (!isTradeSymbol(symbol)) {
    return { ok: false, message: "trade_invalid_symbol" };
  }
  if (!TRADE_LEVERAGES.includes(levRaw as 2 | 5 | 10)) {
    return { ok: false, message: "trade_invalid_leverage" };
  }
  const closed = await countClosedFutures(userId);
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

  const totalDebit = marginUsdt + feeOpen;
  const batchId = randomUUID();

  try {
    const positionId = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!u) throw new Error("user");
      const bal = numFromNumeric(u.balance?.toString());
      if (bal + 1e-18 < totalDebit) {
        throw new Error("insufficient");
      }

      await debitUserAsset(tx, userId, "USDT", fmtTradeAmount(totalDebit));

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
          qtyBase: fmtTradeAmount(qty),
          feeOpenUsdt: fmtTradeAmount(feeOpen),
          status: "open",
          meta: { batchOpen: batchId },
        })
        .returning({ id: tradeFuturesPositions.id });

      const ins = inserted[0];
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

      return ins?.id ?? "";
    });

    if (!positionId) return { ok: false, message: "trade_open_failed" };
    return { ok: true, positionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") return { ok: false, message: "trade_insufficient_usdt" };
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
