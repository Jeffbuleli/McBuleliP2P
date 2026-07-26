import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, users } from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { applyUsdtCreditWithAutoRepay } from "@/lib/loans-service";
import {
  fmtWalletAmount,
  isWalletAsset,
  numFromNumeric,
  type WalletAsset,
} from "@/lib/wallet-types";

export type TransferRecipientPreview = {
  userId: string;
  displayName: string;
  emailMasked: string;
  /** Full email only when the sender typed it (not from Pay UUID alone). */
  email?: string;
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

/** Resolve & validate a transfer recipient before debit (preview / confirm). */
export async function resolveTransferRecipient(args: {
  fromUserId: string;
  recipientEmail?: string;
  recipientUserId?: string;
}): Promise<
  | { ok: true; recipient: TransferRecipientPreview }
  | { ok: false; message: string }
> {
  const email = args.recipientEmail?.trim().toLowerCase() ?? "";
  const recipientUserId = args.recipientUserId?.trim() ?? "";
  if (!email && !recipientUserId) {
    return { ok: false, message: "wallet_transfer_recipient_required" };
  }
  if (email && !email.includes("@")) {
    return { ok: false, message: "wallet_transfer_invalid_email" };
  }

  const db = getDb();
  const [recv] = recipientUserId
    ? await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, recipientUserId))
        .limit(1)
    : await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);

  if (!recv) {
    return { ok: false, message: "wallet_transfer_user_not_found" };
  }
  if (recv.id === args.fromUserId) {
    return { ok: false, message: "wallet_transfer_self" };
  }

  const label =
    recv.displayName?.trim() ||
    (email ? email.split("@")[0]! : recv.email.split("@")[0]!) ||
    "McBuleli";

  return {
    ok: true,
    recipient: {
      userId: recv.id,
      displayName: label.slice(0, 64),
      emailMasked: maskEmail(recv.email),
      ...(email ? { email: recv.email } : {}),
    },
  };
}

export async function executeInternalTransfer(args: {
  fromUserId: string;
  recipientEmail?: string;
  recipientUserId?: string;
  asset: string;
  amountStr: string;
  memo?: string;
}): Promise<
  | { ok: true; batchId: string; recipient: TransferRecipientPreview }
  | { ok: false; message: string }
> {
  if (!isWalletAsset(args.asset)) {
    return { ok: false, message: "wallet_transfer_invalid_asset" };
  }
  const asset = args.asset;
  const amt = Number(args.amountStr);
  if (!Number.isFinite(amt) || amt <= 0) {
    return { ok: false, message: "wallet_transfer_invalid_amount" };
  }
  const amtStr = fmtWalletAmount(amt);
  const email = args.recipientEmail?.trim().toLowerCase() ?? "";
  const recipientUserId = args.recipientUserId?.trim() ?? "";
  const memo = args.memo?.trim() ? args.memo.trim().slice(0, 180) : null;

  const resolved = await resolveTransferRecipient({
    fromUserId: args.fromUserId,
    recipientEmail: email || undefined,
    recipientUserId: recipientUserId || undefined,
  });
  if (!resolved.ok) return resolved;

  const db = getDb();
  try {
    const batchId = randomUUID();
    const out = await db.transaction(async (tx) => {
      const recvId = resolved.recipient.userId;

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
      let recvCredit = amtStr;
      if (asset === "USDT") {
        const applied = await applyUsdtCreditWithAutoRepay(tx, {
          userId: recvId,
          creditUsdtStr: amtStr,
          source: "transfer_in",
          meta: { fromUserId: args.fromUserId },
        });
        recvCredit = applied.walletCreditUsdtStr;
      }
      if (Number(recvCredit) > 0) {
        await creditUserAsset(tx, recvId, asset as WalletAsset, recvCredit);
      }

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.fromUserId,
          entryType: "transfer_out",
          asset,
          amount: `-${amtStr}`,
          feeUsdEquivalent: "0",
          counterpartyUserId: recvId,
          meta: { toEmail: email || resolved.recipient.emailMasked, memo },
        },
        {
          batchId,
          userId: recvId,
          entryType: "transfer_in",
          asset,
          amount: recvCredit,
          feeUsdEquivalent: "0",
          counterpartyUserId: args.fromUserId,
          meta: memo ? { memo } : {},
        },
      ]);

      return {
        ok: true as const,
        batchId,
        recipient: resolved.recipient,
      };
    });
    return out;
  } catch {
    return { ok: false, message: "wallet_transfer_failed" };
  }
}
