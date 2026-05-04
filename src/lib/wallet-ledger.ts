import { walletLedgerEntries } from "@/db/schema";

export type LedgerInsert = {
  batchId: string;
  userId: string;
  entryType: string;
  asset: string;
  amount: string;
  feeUsdEquivalent?: string;
  counterpartyUserId?: string | null;
  meta?: Record<string, unknown> | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertWalletLedgerLines(tx: any, rows: LedgerInsert[]): Promise<void> {
  if (rows.length === 0) return;
  await tx.insert(walletLedgerEntries).values(
    rows.map((r) => ({
      batchId: r.batchId,
      userId: r.userId,
      entryType: r.entryType,
      asset: r.asset,
      amount: r.amount,
      feeUsdEquivalent: r.feeUsdEquivalent ?? "0",
      counterpartyUserId: r.counterpartyUserId ?? null,
      meta: r.meta ?? null,
    })),
  );
}
