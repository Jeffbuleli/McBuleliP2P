import { and, desc, eq, lte } from "drizzle-orm";
import { creditTradeDemoUsdt } from "@/lib/trade-demo-balance";
import {
  debitDemoTradingCollateral,
  fetchPiUsdMark,
} from "@/lib/trade-demo-collateral";
import { randomUUID } from "node:crypto";
import { getDb, tradeSimpleOptions, users } from "@/db";
import {
  TRADE_OPTIONS_DURATIONS_SEC,
  TRADE_OPTIONS_FEE_RATE,
  TRADE_OPTIONS_PAYOUT_PCT,
  isTradeSymbol,
  tradeMaxOptionsStakeUsdt,
} from "@/lib/trade-config";
import { fmtTradeAmount } from "@/lib/trade-math";
import { fetchSymbolTicker } from "@/lib/trade-price";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { numFromNumeric } from "@/lib/wallet-types";

function settleOutcome(params: {
  direction: "call" | "put";
  entry: number;
  settlement: number;
}): "won" | "lost" {
  const { direction, entry, settlement } = params;
  if (direction === "call") {
    return settlement > entry ? "won" : "lost";
  }
  return settlement < entry ? "won" : "lost";
}

export async function settleExpiredOptions(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  const pending = await db
    .select()
    .from(tradeSimpleOptions)
    .where(
      and(
        eq(tradeSimpleOptions.userId, userId),
        eq(tradeSimpleOptions.status, "pending"),
        lte(tradeSimpleOptions.expiryAt, now),
      ),
    );

  for (const o of pending) {
    const t = await fetchSymbolTicker(o.symbol);
    if (!t) continue;
    const settlement = t.lastPrice;
    const entry = numFromNumeric(o.entryPrice?.toString());
    const dir = o.direction === "put" ? "put" : "call";
    const out = settleOutcome({ direction: dir, entry, settlement });
    const stake = numFromNumeric(o.stakeUsdt?.toString());
    const payoutPct = numFromNumeric(o.payoutPct?.toString());

    let pay = 0;
    if (out === "won") {
      pay = stake + (stake * payoutPct) / 100;
    }

    const batchId = randomUUID();
    const isDemo = Boolean(o.isDemo);
    try {
      await db.transaction(async (tx) => {
        await tx
          .update(tradeSimpleOptions)
          .set({
            status: "settled",
            settledAt: now,
            settlementPrice: fmtTradeAmount(settlement),
            outcome: out,
            meta: { batchSettle: batchId },
          })
          .where(eq(tradeSimpleOptions.id, o.id));

        if (pay > 1e-18) {
          if (isDemo) {
            await creditTradeDemoUsdt(tx, userId, fmtTradeAmount(pay));
          } else {
            await creditUserAsset(tx, userId, "USDT", fmtTradeAmount(pay));
          }
        }
        if (!isDemo) {
          await insertWalletLedgerLines(tx, [
            {
              batchId,
              userId,
              entryType: "trade_options_settle",
              asset: "USDT",
              amount: pay > 1e-18 ? fmtTradeAmount(pay) : "0",
              meta: {
                optionId: o.id,
                outcome: out,
                settlement,
              },
            },
          ]);
        }
      });
    } catch {
      // ignore single-row failure; next poll retries
    }
  }
}

export async function listSimpleOptions(
  userId: string,
  mode: "demo" | "live",
) {
  const isDemo = mode === "demo";
  await settleExpiredOptions(userId);
  const db = getDb();
  const rows = await db
    .select()
    .from(tradeSimpleOptions)
    .where(
      and(
        eq(tradeSimpleOptions.userId, userId),
        eq(tradeSimpleOptions.isDemo, isDemo),
      ),
    )
    .orderBy(desc(tradeSimpleOptions.createdAt))
    .limit(40);
  return rows.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    direction: o.direction,
    stakeUsdt: o.stakeUsdt?.toString() ?? "0",
    payoutPct: o.payoutPct?.toString() ?? "0",
    durationSec: o.durationSec,
    expiryAt: o.expiryAt.toISOString(),
    entryPrice: o.entryPrice?.toString() ?? "0",
    status: o.status,
    outcome: o.outcome,
    settlementPrice: o.settlementPrice?.toString() ?? null,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function openSimpleOption(args: {
  userId: string;
  mode: "demo" | "live";
  symbol: string;
  direction: "call" | "put";
  stakeUsdt: number;
  durationSec: number;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const { userId, mode, symbol, direction, stakeUsdt, durationSec } = args;
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
  if (direction !== "call" && direction !== "put") {
    return { ok: false, message: "trade_options_invalid_direction" };
  }
  if (
    !(
      TRADE_OPTIONS_DURATIONS_SEC as readonly number[]
    ).includes(durationSec)
  ) {
    return { ok: false, message: "trade_options_invalid_duration" };
  }

  if (
    !Number.isFinite(stakeUsdt) ||
    stakeUsdt <= 0 ||
    stakeUsdt > tradeMaxOptionsStakeUsdt()
  ) {
    return { ok: false, message: "trade_options_invalid_stake" };
  }

  const ticker = await fetchSymbolTicker(symbol);
  if (!ticker) {
    return { ok: false, message: "trade_price_unavailable" };
  }

  const fee = stakeUsdt * TRADE_OPTIONS_FEE_RATE;
  const total = stakeUsdt + fee;
  const expiryAt = new Date(Date.now() + durationSec * 1000);
  const batchId = randomUUID();
  const payoutPct = TRADE_OPTIONS_PAYOUT_PCT;

  const db = getDb();
  const piUsdMark = isDemo ? await fetchPiUsdMark() : 0;

  try {
    const id = await db.transaction(async (tx) => {
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
        await debitDemoTradingCollateral(tx, userId, total, piUsdMark);
      } else {
        if (!u.tradeLiveEnabled) throw new Error("live_disabled");
        const bal = numFromNumeric(u.balance?.toString());
        if (bal + 1e-18 < total) throw new Error("insufficient");
        await debitUserAsset(tx, userId, "USDT", fmtTradeAmount(total));
      }

      const inserted = await tx
        .insert(tradeSimpleOptions)
        .values({
          userId,
          symbol,
          direction,
          stakeUsdt: fmtTradeAmount(stakeUsdt),
          payoutPct: fmtTradeAmount(payoutPct),
          durationSec,
          expiryAt,
          entryPrice: fmtTradeAmount(ticker.lastPrice),
          feeUsdt: fmtTradeAmount(fee),
          status: "pending",
          isDemo,
          meta: { batchOpen: batchId },
        })
        .returning({ id: tradeSimpleOptions.id });

      const row = inserted[0];
      if (!isDemo) {
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId,
            entryType: "trade_options_open",
            asset: "USDT",
            amount: `-${fmtTradeAmount(total)}`,
            meta: {
              symbol,
              direction,
              stake: stakeUsdt,
              fee,
              durationSec,
            },
          },
        ]);
      }
      return row?.id ?? "";
    });

    if (!id) return { ok: false, message: "trade_options_open_failed" };
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") {
      return { ok: false, message: "trade_insufficient_usdt" };
    }
    if (msg === "pi_price_unavailable") {
      return { ok: false, message: "trade_pi_price_unavailable" };
    }
    if (msg === "live_disabled") {
      return { ok: false, message: "trade_live_not_enabled" };
    }
    return { ok: false, message: "trade_options_open_failed" };
  }
}
