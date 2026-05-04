import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, users } from "@/db";
import { cdfPerOneUsd } from "@/lib/fx";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric, type WalletAsset } from "@/lib/wallet-types";

export async function executeFiatWithdraw(args: {
  userId: string;
  asset: "USD" | "CDF";
  grossAmountStr: string;
}): Promise<{ ok: true; batchId: string; net: string; fee: string } | { ok: false; message: string }> {
  const gross = Number(args.grossAmountStr);
  if (!Number.isFinite(gross) || gross <= 0) {
    return { ok: false, message: "wallet_fiat_invalid_amount" };
  }
  const fee = gross * FIAT_FEE_RATE;
  const net = gross - fee;
  if (net <= 0) {
    return { ok: false, message: "wallet_fiat_invalid_amount" };
  }

  const grossStr = fmtWalletAmount(gross);
  const feeStr = fmtWalletAmount(fee);
  const netStr = fmtWalletAmount(net);
  const pocket = args.asset as WalletAsset;

  const db = getDb();
  try {
    const batchId = randomUUID();
    const out = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({
          usdBalance: users.usdBalance,
          cdfBalance: users.cdfBalance,
        })
        .from(users)
        .where(eq(users.id, args.userId));

      if (!u) {
        return { ok: false as const, message: "wallet_not_found" };
      }
      const bal =
        args.asset === "USD"
          ? numFromNumeric(u.usdBalance)
          : numFromNumeric(u.cdfBalance);
      if (bal + 1e-12 < gross) {
        return { ok: false as const, message: "wallet_insufficient_balance" };
      }

      await debitUserAsset(tx, args.userId, pocket, grossStr);

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "fiat_withdraw",
          asset: args.asset,
          amount: `-${grossStr}`,
          feeUsdEquivalent:
            args.asset === "USD"
              ? feeStr
              : (fee / cdfPerOneUsd()).toFixed(8),
          meta: {
            gross: grossStr,
            fee: feeStr,
            netToPayout: netStr,
            feeRate: FIAT_FEE_RATE,
          },
        },
      ]);

      return {
        ok: true as const,
        batchId,
        net: netStr,
        fee: feeStr,
      };
    });
    return out;
  } catch {
    return { ok: false, message: "wallet_fiat_withdraw_failed" };
  }
}
