import { and, asc, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb } from "@/db";

export type FiatFreshpayRow = {
  reference: string;
  kind: string;
  status: string;
  currency: string;
  amount: string;
  provider: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
};

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code =
    (err as { code?: string }).code ??
    (err as { cause?: { code?: string } }).cause?.code;
  return code === "42P01";
}

/** Safe read — returns [] when FreshPay tables are not migrated yet. */
export async function fetchFiatFreshpayRows(args: {
  userId: string;
  currency?: string;
  sort: "newest" | "oldest";
  limit?: number;
}): Promise<FiatFreshpayRow[]> {
  const db = getDb();
  const order = args.sort === "oldest" ? asc : desc;
  const where: SQL[] = [eq(fiatFreshpayTransactions.userId, args.userId)];
  if (args.currency) {
    where.push(eq(fiatFreshpayTransactions.currency, args.currency));
  }

  try {
    let q = db
      .select({
        reference: fiatFreshpayTransactions.reference,
        kind: fiatFreshpayTransactions.kind,
        status: fiatFreshpayTransactions.status,
        currency: fiatFreshpayTransactions.currency,
        amount: fiatFreshpayTransactions.amount,
        provider: fiatFreshpayTransactions.provider,
        meta: fiatFreshpayTransactions.meta,
        createdAt: fiatFreshpayTransactions.createdAt,
      })
      .from(fiatFreshpayTransactions)
      .where(and(...where))
      .orderBy(order(fiatFreshpayTransactions.createdAt));

    if (args.limit != null) {
      q = q.limit(args.limit) as typeof q;
    }

    return await q;
  } catch (err) {
    if (isMissingRelationError(err)) return [];
    throw err;
  }
}

/** Pending fiat tx counts for treasury — zeroed when table is missing. */
export async function countPendingFiatFreshpay(args: {
  failedSince: Date;
}): Promise<{ processing: number; failed24h: number }> {
  const db = getDb();
  try {
    const [proc] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(fiatFreshpayTransactions)
      .where(eq(fiatFreshpayTransactions.status, "PROCESSING"));
    const [fail] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(fiatFreshpayTransactions)
      .where(
        and(
          eq(fiatFreshpayTransactions.status, "FAILED"),
          gte(fiatFreshpayTransactions.updatedAt, args.failedSince),
        ),
      );
    return { processing: proc?.c ?? 0, failed24h: fail?.c ?? 0 };
  } catch (err) {
    if (isMissingRelationError(err)) return { processing: 0, failed24h: 0 };
    throw err;
  }
}
