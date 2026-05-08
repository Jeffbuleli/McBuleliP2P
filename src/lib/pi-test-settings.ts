import { desc, eq } from "drizzle-orm";
import { getDb, piTestLedgerEntries, users } from "@/db";
import { fmtWalletAmount } from "@/lib/wallet-types";

export async function getPiTestBalance(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ piTestBalance: users.piTestBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.piTestBalance != null ? row.piTestBalance.toString() : "0";
}

/** Super-admin manual override (settings screen). */
export async function setPiTestBalanceUser(userId: string, value: string): Promise<void> {
  const db = getDb();
  await db.update(users).set({ piTestBalance: value }).where(eq(users.id, userId));
}

export async function adjustPiTestBalance(args: {
  kind: "deposit" | "withdraw";
  amount: number;
  memo?: string | null;
  actorUserId: string;
  targetUserId: string;
}): Promise<{ ok: true; balance: string } | { ok: false; message: string }> {
  if (!Number.isFinite(args.amount) || args.amount <= 0) {
    return { ok: false, message: "Invalid amount" };
  }
  const amtStr = fmtWalletAmount(args.amount);

  const db = getDb();
  try {
    const result = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({ piTestBalance: users.piTestBalance })
        .from(users)
        .where(eq(users.id, args.targetUserId))
        .limit(1);
      if (!u) {
        return { ok: false as const, message: "User not found" };
      }

      const cur = Number(u.piTestBalance ?? 0);
      const next =
        args.kind === "deposit" ? cur + args.amount : cur - args.amount;
      if (!Number.isFinite(next) || next < -1e-12) {
        return { ok: false as const, message: "Insufficient Pi Test balance" };
      }
      const nextStr = fmtWalletAmount(Math.max(0, next));

      await tx
        .update(users)
        .set({ piTestBalance: nextStr })
        .where(eq(users.id, args.targetUserId));

      await tx.insert(piTestLedgerEntries).values({
        kind: args.kind,
        amount: amtStr,
        memo: args.memo?.trim() ? args.memo.trim() : null,
        actorUserId: args.actorUserId,
        userId: args.targetUserId,
      });

      return { ok: true as const, balance: nextStr };
    });

    if (!result.ok) return result;
    return { ok: true, balance: result.balance };
  } catch {
    return { ok: false, message: "Failed to update Pi Test balance" };
  }
}

export async function listPiTestLedger(
  userId: string,
  limit = 30,
): Promise<
  Array<{
    id: string;
    kind: string;
    amount: string;
    memo: string | null;
    createdAt: Date;
  }>
> {
  const db = getDb();
  return db
    .select({
      id: piTestLedgerEntries.id,
      kind: piTestLedgerEntries.kind,
      amount: piTestLedgerEntries.amount,
      memo: piTestLedgerEntries.memo,
      createdAt: piTestLedgerEntries.createdAt,
    })
    .from(piTestLedgerEntries)
    .where(eq(piTestLedgerEntries.userId, userId))
    .orderBy(desc(piTestLedgerEntries.createdAt))
    .limit(Math.max(1, Math.min(100, limit)));
}
