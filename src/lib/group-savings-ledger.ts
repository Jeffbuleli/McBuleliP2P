import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, groupWalletLedgerEntries } from "@/db";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export async function getGroupUsdtBalance(groupId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ s: sql<string | null>`sum(${groupWalletLedgerEntries.amount})` })
    .from(groupWalletLedgerEntries)
    .where(sql`${groupWalletLedgerEntries.groupId} = ${groupId}::uuid`);
  const s = rows[0]?.s ?? "0";
  return numFromNumeric(s);
}

export function newBatchId(): string {
  return randomUUID();
}

export function fmtUsdt(n: number): string {
  return fmtWalletAmount(n);
}

