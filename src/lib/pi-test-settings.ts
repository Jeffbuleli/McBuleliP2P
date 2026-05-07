import { desc, eq, sql } from "drizzle-orm";
import { getDb, piTestLedgerEntries, platformSettings } from "@/db";
import { PlatformSettingKey } from "@/lib/platform-settings";
import { fmtWalletAmount } from "@/lib/wallet-types";

export async function getPiTestBalance(): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, PlatformSettingKey.PI_TEST_BALANCE))
    .limit(1);
  return row?.value ?? "0";
}

export async function setPiTestBalance(value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({ key: PlatformSettingKey.PI_TEST_BALANCE, value })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function adjustPiTestBalance(args: {
  kind: "deposit" | "withdraw";
  amount: number;
  memo?: string | null;
  actorUserId: string;
}): Promise<{ ok: true; balance: string } | { ok: false; message: string }> {
  if (!Number.isFinite(args.amount) || args.amount <= 0) {
    return { ok: false, message: "Invalid amount" };
  }
  const amtStr = fmtWalletAmount(args.amount);

  const db = getDb();
  try {
    const out = await db.transaction(async (tx) => {
      const [curRow] = await tx
        .select({ value: platformSettings.value })
        .from(platformSettings)
        .where(eq(platformSettings.key, PlatformSettingKey.PI_TEST_BALANCE))
        .limit(1);
      const cur = Number(curRow?.value ?? "0");
      const next =
        args.kind === "deposit" ? cur + args.amount : cur - args.amount;
      if (!Number.isFinite(next) || next < -1e-12) {
        return { ok: false as const, message: "Insufficient Pi Test balance" };
      }

      await tx
        .insert(platformSettings)
        .values({
          key: PlatformSettingKey.PI_TEST_BALANCE,
          value: fmtWalletAmount(Math.max(0, next)),
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: fmtWalletAmount(Math.max(0, next)), updatedAt: new Date() },
        });

      await tx.insert(piTestLedgerEntries).values({
        kind: args.kind,
        amount: amtStr,
        memo: args.memo?.trim() ? args.memo.trim() : null,
        actorUserId: args.actorUserId,
      });

      return { ok: true as const, balance: fmtWalletAmount(Math.max(0, next)) };
    });
    return out;
  } catch {
    return { ok: false, message: "Failed to update Pi Test balance" };
  }
}

export async function listPiTestLedger(limit = 30): Promise<
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
    .orderBy(desc(piTestLedgerEntries.createdAt))
    .limit(Math.max(1, Math.min(100, limit)));
}

