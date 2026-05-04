import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, users } from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import {
  fmtWalletAmount,
  isWalletAsset,
  numFromNumeric,
  type WalletAsset,
} from "@/lib/wallet-types";

export async function executeInternalTransfer(args: {
  fromUserId: string;
  recipientEmail: string;
  asset: string;
  amountStr: string;
}): Promise<{ ok: true; batchId: string } | { ok: false; message: string }> {
  if (!isWalletAsset(args.asset)) {
    return { ok: false, message: "wallet_transfer_invalid_asset" };
  }
  const asset = args.asset;
  const amt = Number(args.amountStr);
  if (!Number.isFinite(amt) || amt <= 0) {
    return { ok: false, message: "wallet_transfer_invalid_amount" };
  }
  const amtStr = fmtWalletAmount(amt);
  const email = args.recipientEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, message: "wallet_transfer_invalid_email" };
  }

  const db = getDb();
  try {
    const batchId = randomUUID();
    const out = await db.transaction(async (tx) => {
      const [recv] = await tx
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);

      if (!recv) {
        return { ok: false as const, message: "wallet_transfer_user_not_found" };
      }
      if (recv.id === args.fromUserId) {
        return { ok: false as const, message: "wallet_transfer_self" };
      }

      const [u] = await tx
        .select({
          balance: users.balance,
          piBalance: users.piBalance,
          usdBalance: users.usdBalance,
          cdfBalance: users.cdfBalance,
        })
        .from(users)
        .where(eq(users.id, args.fromUserId));

      if (!u) {
        return { ok: false as const, message: "wallet_not_found" };
      }

      const b = numFromNumeric(u.balance);
      const pi = numFromNumeric(u.piBalance);
      const usd = numFromNumeric(u.usdBalance);
      const cdf = numFromNumeric(u.cdfBalance);
      const bal =
        asset === "USDT" ? b : asset === "PI" ? pi : asset === "USD" ? usd : cdf;
      if (bal + 1e-18 < amt) {
        return { ok: false as const, message: "wallet_insufficient_balance" };
      }

      await debitUserAsset(tx, args.fromUserId, asset as WalletAsset, amtStr);
      await creditUserAsset(tx, recv.id, asset as WalletAsset, amtStr);

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.fromUserId,
          entryType: "transfer_out",
          asset,
          amount: `-${amtStr}`,
          feeUsdEquivalent: "0",
          counterpartyUserId: recv.id,
          meta: { toEmail: email },
        },
        {
          batchId,
          userId: recv.id,
          entryType: "transfer_in",
          asset,
          amount: amtStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: args.fromUserId,
          meta: {},
        },
      ]);

      return { ok: true as const, batchId };
    });
    return out;
  } catch {
    return { ok: false, message: "wallet_transfer_failed" };
  }
}
