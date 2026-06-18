import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, users } from "@/db";
import { fetchReferenceRates } from "@/lib/reference-rates";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { applyUsdtCreditWithAutoRepay } from "@/lib/loans-service";
import { quoteSwap } from "@/lib/wallet-convert";
import {
  fmtWalletAmount,
  isWalletAsset,
  numFromNumeric,
  type WalletAsset,
} from "@/lib/wallet-types";

export async function executeWalletSwap(args: {
  userId: string;
  from: string;
  to: string;
  amountStr: string;
}): Promise<{ ok: true; batchId: string } | { ok: false; message: string }> {
  if (!isWalletAsset(args.from) || !isWalletAsset(args.to)) {
    return { ok: false, message: "wallet_swap_invalid_asset" };
  }
  const from = args.from;
  const to = args.to;
  const fromAmount = Number(args.amountStr);
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return { ok: false, message: "wallet_swap_invalid_amount" };
  }

  const rates = await fetchReferenceRates();
  const q = quoteSwap({ from, to, fromAmount, rates });
  if (!q.ok) return q;

  const fromAmtStr = fmtWalletAmount(q.fromAmount);
  const toAmtStr = fmtWalletAmount(q.toAmount);
  const feeUsdStr = q.feeUsd.toFixed(8);

  const db = getDb();

  try {
    const batchId = randomUUID();
    const result = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({
          balance: users.balance,
          piBalance: users.piBalance,
          usdBalance: users.usdBalance,
          cdfBalance: users.cdfBalance,
        })
        .from(users)
        .where(eq(users.id, args.userId));

      if (!u) {
        return { ok: false as const, message: "wallet_not_found" };
      }

      const b = numFromNumeric(u.balance);
      const pi = numFromNumeric(u.piBalance);
      const usd = numFromNumeric(u.usdBalance);
      const cdf = numFromNumeric(u.cdfBalance);

      const fromBal =
        from === "USDT" ? b : from === "PI" ? pi : from === "USD" ? usd : cdf;
      if (fromBal + 1e-18 < fromAmount) {
        return { ok: false as const, message: "wallet_insufficient_balance" };
      }

      await debitUserAsset(tx, args.userId, from as WalletAsset, fromAmtStr);
      let toCredit = toAmtStr;
      if (to === "USDT") {
        const applied = await applyUsdtCreditWithAutoRepay(tx, {
          userId: args.userId,
          creditUsdtStr: toAmtStr,
          source: "swap_in",
          meta: { fromAsset: from },
        });
        toCredit = applied.walletCreditUsdtStr;
      }
      if (Number(toCredit) > 0) {
        await creditUserAsset(tx, args.userId, to as WalletAsset, toCredit);
      }

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "swap_fee",
          asset: from,
          amount: "0",
          feeUsdEquivalent: feeUsdStr,
          meta: { swapFeeUsd: q.feeUsd, swapFeeRate: q.feeRate, fromAsset: from, toAsset: to },
        },
        {
          batchId,
          userId: args.userId,
          entryType: "swap_out",
          asset: from,
          amount: `-${fromAmtStr}`,
          feeUsdEquivalent: "0",
          meta: { toAsset: to },
        },
        {
          batchId,
          userId: args.userId,
          entryType: "swap_in",
          asset: to,
          amount: toCredit,
          feeUsdEquivalent: "0",
          meta: { fromAsset: from },
        },
      ]);

      return { ok: true as const, batchId };
    });

    return result;
  } catch {
    return { ok: false, message: "wallet_swap_failed" };
  }
}
