import { NextResponse } from "next/server";
import { and, desc, eq, like } from "drizzle-orm";
import { getDb, walletLedgerEntries } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { isWalletAsset } from "@/lib/wallet-types";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.trim();
  const asset = searchParams.get("asset")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);

  const conditions = [eq(walletLedgerEntries.userId, userId)];
  if (type) {
    conditions.push(like(walletLedgerEntries.entryType, `${type}%`));
  }
  if (asset && isWalletAsset(asset)) {
    conditions.push(eq(walletLedgerEntries.asset, asset));
  }

  const db = getDb();
  const rows = await db
    .select({
      id: walletLedgerEntries.id,
      batchId: walletLedgerEntries.batchId,
      entryType: walletLedgerEntries.entryType,
      asset: walletLedgerEntries.asset,
      amount: walletLedgerEntries.amount,
      feeUsdEquivalent: walletLedgerEntries.feeUsdEquivalent,
      createdAt: walletLedgerEntries.createdAt,
      meta: walletLedgerEntries.meta,
    })
    .from(walletLedgerEntries)
    .where(and(...conditions))
    .orderBy(desc(walletLedgerEntries.createdAt))
    .limit(limit);

  return NextResponse.json({
    entries: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
