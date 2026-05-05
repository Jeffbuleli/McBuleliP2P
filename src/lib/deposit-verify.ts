import { and, count, eq, sql } from "drizzle-orm";
import { getDb, deposits, txidLedger, users } from "@/db";
import type { InferSelectModel } from "drizzle-orm";
import {
  binanceDepositHistoryByTxid,
  binanceDepositIsSuccessful,
} from "./binance";
import { canonicalFromBinanceNetwork } from "./networks";
import { getAmountTolerance, getMinDeposit } from "./env";
import {
  MIN_DEPOSIT_USDT_FIRST,
  MIN_DEPOSIT_USDT_SUBSEQUENT,
} from "@/lib/usdt-deposit-constants";
import { DepositStatus } from "./status";
import {
  okxDepositHistoryByTxid,
  okxDepositStateIsFinal,
} from "@/lib/okx";
import { getPiOkxChain } from "@/lib/pi-constants";
import { tryAwardReferralFromCryptoDeposit } from "@/lib/referral-service";

type DepositRow = InferSelectModel<typeof deposits>;

async function getEffectiveMinDepositUsdt(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: count() })
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, userId),
        eq(deposits.asset, "USDT"),
        eq(deposits.status, DepositStatus.CONFIRMED),
      ),
    );
  const n = Number(row?.c ?? 0);
  return n === 0 ? MIN_DEPOSIT_USDT_FIRST : MIN_DEPOSIT_USDT_SUBSEQUENT;
}

function normAddr(a: string) {
  return a.trim();
}

function cmpAddr(a: string, b: string) {
  const x = normAddr(a);
  const y = normAddr(b);
  if (x.startsWith("0x")) return x.toLowerCase() === y.toLowerCase();
  return x === y;
}

function cmpMemo(a: string | null | undefined, b: string | null | undefined) {
  const na = (a ?? "").trim();
  const nb = (b ?? "").trim();
  if (!na && !nb) return true;
  return na === nb;
}

export type VerifyResult =
  | { ok: true; amount: string }
  | { ok: false; failed: true; reason: string }
  | { ok: false; failed: false; reason: string };

async function verifyBinanceDeposit(
  deposit: DepositRow,
  txidNorm: string,
  min: number,
  tol: number,
): Promise<VerifyResult> {
  const rows = await binanceDepositHistoryByTxid({
    coin: deposit.asset,
    txId: txidNorm,
  });
  const row = rows[0];
  if (!row) {
    return {
      ok: false,
      failed: false,
      reason:
        "TXID not found in our records yet. If you just sent funds, wait for confirmations and try again.",
    };
  }
  if (!binanceDepositIsSuccessful(row)) {
    return {
      ok: false,
      failed: false,
      reason: "Deposit is still being credited (pending on our side).",
    };
  }
  if (row.coin.toUpperCase() !== deposit.asset.toUpperCase()) {
    return {
      ok: false,
      failed: true,
      reason: "Wrong asset: exchange record does not match selected crypto.",
    };
  }
  const netCanon = canonicalFromBinanceNetwork(row.coin, row.network);
  if (netCanon !== deposit.networkCanonical) {
    return {
      ok: false,
      failed: true,
      reason:
        "Wrong network: this transaction does not match the selected network (irreversible mismatch).",
    };
  }
  if (!cmpAddr(row.address, deposit.addressShown)) {
    return {
      ok: false,
      failed: true,
      reason: "Destination address does not match the deposit address shown.",
    };
  }
  if (!cmpMemo(row.addressTag, deposit.memoShown)) {
    return {
      ok: false,
      failed: true,
      reason: "Memo/tag does not match the required value for this deposit.",
    };
  }
  const amt = Number(row.amount);
  if (!Number.isFinite(amt) || amt + tol < min) {
    return {
      ok: false,
      failed: true,
      reason: `Amount below minimum (${min} ${deposit.asset}).`,
    };
  }
  return { ok: true, amount: row.amount };
}

async function verifyOkxPiDeposit(
  deposit: DepositRow,
  txidNorm: string,
  min: number,
  tol: number,
): Promise<VerifyResult> {
  const rows = await okxDepositHistoryByTxid({
    ccy: "PI",
    txId: txidNorm,
  });
  const row =
    rows.find((r) => (r.txId ?? "").trim().toLowerCase() === txidNorm.toLowerCase()) ??
    rows[0];
  if (!row) {
    return {
      ok: false,
      failed: false,
      reason:
        "TXID not found on OKX yet. Wait for on-chain confirmations, then try again.",
    };
  }
  if (!okxDepositStateIsFinal(row.state)) {
    return {
      ok: false,
      failed: false,
      reason: "Deposit is still being processed on OKX.",
    };
  }
  if ((row.ccy ?? "").toUpperCase() !== "PI") {
    return {
      ok: false,
      failed: true,
      reason: "Wrong asset: OKX record is not PI.",
    };
  }
  const chainExpect = getPiOkxChain().toUpperCase();
  const chainGot = (row.chain ?? "").toUpperCase();
  if (chainGot && chainExpect && chainGot !== chainExpect) {
    return {
      ok: false,
      failed: true,
      reason: "Wrong network: OKX chain does not match the expected Pi chain.",
    };
  }
  const dest = (row.to ?? "").trim();
  if (dest && !cmpAddr(dest, deposit.addressShown)) {
    return {
      ok: false,
      failed: true,
      reason: "Destination address does not match the deposit address shown.",
    };
  }
  const tag = (row as { tag?: string }).tag;
  if (!cmpMemo(tag, deposit.memoShown)) {
    return {
      ok: false,
      failed: true,
      reason: "Memo/tag does not match the required value for this deposit.",
    };
  }
  const rawAmt = row.actualDepAmt ?? row.amt ?? "0";
  const amt = Number(rawAmt);
  if (!Number.isFinite(amt) || amt + tol < min) {
    return {
      ok: false,
      failed: true,
      reason: `Amount below minimum (${min} ${deposit.asset}).`,
    };
  }
  return { ok: true, amount: String(rawAmt) };
}

export async function verifyDepositTx(
  deposit: DepositRow,
  txidNorm: string,
): Promise<VerifyResult> {
  const tol = getAmountTolerance();

  if (deposit.provider === "binance") {
    const min =
      deposit.asset.toUpperCase() === "USDT"
        ? await getEffectiveMinDepositUsdt(deposit.userId)
        : getMinDeposit(deposit.asset);
    return verifyBinanceDeposit(deposit, txidNorm, min, tol);
  }
  if (deposit.provider === "okx" && deposit.asset.toUpperCase() === "PI") {
    const minPi = getMinDeposit(deposit.asset);
    return verifyOkxPiDeposit(deposit, txidNorm, minPi, tol);
  }

  return { ok: false, failed: true, reason: "Unsupported deposit source." };
}

export async function applyConfirmedDeposit(args: {
  deposit: DepositRow;
  userId: string;
  txidNorm: string;
  amountStr: string;
}) {
  if (args.deposit.userId !== args.userId) {
    throw new Error("Forbidden");
  }
  const db = getDb();
  const isPi = args.deposit.asset.toUpperCase() === "PI";
  await db.transaction(async (tx) => {
    const [dup] = await tx
      .select()
      .from(txidLedger)
      .where(eq(txidLedger.txidNorm, args.txidNorm))
      .limit(1);
    if (dup) {
      throw new Error("This TXID was already used.");
    }

    await tx.insert(txidLedger).values({
      txidNorm: args.txidNorm,
      provider: args.deposit.provider,
      depositId: args.deposit.id,
    });

    await tx
      .update(deposits)
      .set({
        status: DepositStatus.CONFIRMED,
        txid: args.txidNorm,
        amount: args.amountStr,
        confirmedAt: new Date(),
        failureReason: null,
      })
      .where(
        and(eq(deposits.id, args.deposit.id), eq(deposits.userId, args.userId)),
      );

    if (isPi) {
      await tx
        .update(users)
        .set({
          piBalance: sql`${users.piBalance} + ${args.amountStr}::numeric`,
        })
        .where(eq(users.id, args.userId));
    } else {
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${args.amountStr}::numeric`,
        })
        .where(eq(users.id, args.userId));
    }
  });

  await tryAwardReferralFromCryptoDeposit({
    userId: args.userId,
    depositId: args.deposit.id,
    asset: args.deposit.asset,
    amountStr: args.amountStr,
  });
}

export async function markDepositFailed(
  depositId: string,
  userId: string,
  reason: string,
) {
  const db = getDb();
  await db
    .update(deposits)
    .set({
      status: DepositStatus.FAILED,
      failureReason: reason,
    })
    .where(and(eq(deposits.id, depositId), eq(deposits.userId, userId)));
}
