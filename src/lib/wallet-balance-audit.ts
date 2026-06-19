import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { deposits, fiatFreshpayTransactions, getDb, users, walletLedgerEntries } from "@/db";
import { DepositStatus } from "@/lib/status";
import { freshpayVerify } from "@/lib/freshpay/provider";
import { mapFreshpayVerifyStatus } from "@/lib/freshpay/provider";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import type { WalletAsset } from "@/lib/wallet-types";

const TOL = 1e-6;

export type BalanceAuditRow = {
  userId: string;
  asset: WalletAsset;
  stored: number;
  expected: number;
  delta: number;
  orphan: boolean;
};

async function sumLedger(userId: string, asset: WalletAsset): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${walletLedgerEntries.amount}::numeric), 0)`,
    })
    .from(walletLedgerEntries)
    .where(
      and(eq(walletLedgerEntries.userId, userId), eq(walletLedgerEntries.asset, asset)),
    );
  return Number(row?.total ?? 0);
}

async function sumConfirmedCryptoDeposits(userId: string, asset: "USDT" | "PI"): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${deposits.amount}::numeric), 0)`,
    })
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, userId),
        eq(deposits.asset, asset),
        eq(deposits.status, DepositStatus.CONFIRMED),
      ),
    );
  return Number(row?.total ?? 0);
}

/** Expected pocket balance from auditable sources (ledger + confirmed crypto deposits). */
export async function expectedWalletBalance(
  userId: string,
  asset: WalletAsset,
): Promise<number> {
  const ledger = await sumLedger(userId, asset);
  if (asset === "USDT" || asset === "PI") {
    const cryptoDep = await sumConfirmedCryptoDeposits(userId, asset);
    return ledger + cryptoDep;
  }
  return ledger;
}

export async function auditUserBalances(userId: string): Promise<BalanceAuditRow[]> {
  const db = getDb();
  const [u] = await db
    .select({
      balance: users.balance,
      piBalance: users.piBalance,
      usdBalance: users.usdBalance,
      cdfBalance: users.cdfBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return [];

  const assets: WalletAsset[] = ["USDT", "PI", "USD", "CDF"];
  const storedMap: Record<WalletAsset, number> = {
    USDT: numFromNumeric(u.balance),
    PI: numFromNumeric(u.piBalance),
    USD: numFromNumeric(u.usdBalance),
    CDF: numFromNumeric(u.cdfBalance),
    PI_TEST: 0,
  };

  const rows: BalanceAuditRow[] = [];
  for (const asset of assets) {
    const stored = storedMap[asset];
    const expected = await expectedWalletBalance(userId, asset);
    const delta = stored - expected;
    rows.push({
      userId,
      asset,
      stored,
      expected,
      delta,
      orphan: delta > TOL,
    });
  }
  return rows;
}

export async function auditAllUsersWithOrphans(): Promise<BalanceAuditRow[]> {
  const db = getDb();
  const userRows = await db.select({ id: users.id }).from(users);
  const out: BalanceAuditRow[] = [];
  for (const u of userRows) {
    const rows = await auditUserBalances(u.id);
    out.push(...rows.filter((r) => r.orphan));
  }
  return out;
}

/** Remove orphan balance (stored > expected) — never inflates balances. */
export async function reconcileUserOrphanBalances(
  userId: string,
  opts: { dryRun?: boolean } = {},
): Promise<{ fixed: BalanceAuditRow[]; dryRun: boolean }> {
  const audits = await auditUserBalances(userId);
  const orphans = audits.filter((r) => r.orphan);
  if (opts.dryRun || orphans.length === 0) {
    return { fixed: orphans, dryRun: Boolean(opts.dryRun) };
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    for (const row of orphans) {
      const target = fmtWalletAmount(Math.max(0, row.expected));
      if (row.asset === "USDT") {
        await tx.update(users).set({ balance: target }).where(eq(users.id, userId));
      } else if (row.asset === "PI") {
        await tx.update(users).set({ piBalance: target }).where(eq(users.id, userId));
      } else if (row.asset === "USD") {
        await tx.update(users).set({ usdBalance: target }).where(eq(users.id, userId));
      } else if (row.asset === "CDF") {
        await tx.update(users).set({ cdfBalance: target }).where(eq(users.id, userId));
      }
    }
  });

  return { fixed: orphans, dryRun: false };
}

export async function reconcileAllOrphanBalances(opts: {
  dryRun?: boolean;
} = {}): Promise<{ users: number; rows: BalanceAuditRow[]; dryRun: boolean }> {
  const db = getDb();
  const userRows = await db.select({ id: users.id }).from(users);
  const allFixed: BalanceAuditRow[] = [];
  let usersFixed = 0;

  for (const u of userRows) {
    const { fixed } = await reconcileUserOrphanBalances(u.id, opts);
    if (fixed.length > 0) {
      usersFixed += 1;
      allFixed.push(...fixed);
    }
  }

  return { users: usersFixed, rows: allFixed, dryRun: Boolean(opts.dryRun) };
}

/** Strip orphan fiat credits with no COMPLETED PSP row (ledger fiat_deposit). */
export async function findFiatDepositsWithoutCompletedTx(): Promise<
  { userId: string; ref: string; amount: string; asset: string }[]
> {
  const db = getDb();
  const rows = await db.execute(sql`
    select w.user_id as "userId",
           w.meta->>'fiatDepositRef' as ref,
           w.amount,
           w.asset
    from wallet_ledger_entries w
    left join fiat_freshpay_transactions f
      on f.reference = (w.meta->>'fiatDepositRef')
     and f.status = 'COMPLETED'
     and f.kind = 'deposit'
    where w.entry_type = 'fiat_deposit'
      and f.reference is null
  `);
  return rows as unknown as { userId: string; ref: string; amount: string; asset: string }[];
}

type PhantomDepositRow = {
  ledgerId: string;
  userId: string;
  asset: string;
  amount: string;
  ref: string | null;
  txStatus: string | null;
};

async function listPhantomFiatDepositCredits(): Promise<PhantomDepositRow[]> {
  const db = getDb();
  const rows = await db.execute(sql`
    select w.id as "ledgerId",
           w.user_id as "userId",
           w.asset,
           w.amount,
           w.meta->>'fiatDepositRef' as ref,
           f.status as "txStatus"
    from wallet_ledger_entries w
    left join fiat_freshpay_transactions f
      on f.reference = (w.meta->>'fiatDepositRef')
     and f.kind = 'deposit'
    where w.entry_type = 'fiat_deposit'
      and not exists (
        select 1 from wallet_ledger_entries r
        where r.entry_type = 'fiat_deposit_reversal'
          and (r.meta->>'fiatDepositRef') = (w.meta->>'fiatDepositRef')
          and r.user_id = w.user_id
      )
      and (
        f.reference is null
        or f.status in ('PROCESSING', 'INITIATED', 'FAILED')
      )
  `);
  return rows as unknown as PhantomDepositRow[];
}

async function listCompletedDepositsToReverify(): Promise<PhantomDepositRow[]> {
  const db = getDb();
  const rows = await db.execute(sql`
    select w.id as "ledgerId",
           w.user_id as "userId",
           w.asset,
           w.amount,
           w.meta->>'fiatDepositRef' as ref,
           f.status as "txStatus"
    from wallet_ledger_entries w
    join fiat_freshpay_transactions f
      on f.reference = (w.meta->>'fiatDepositRef')
     and f.kind = 'deposit'
     and f.status = 'COMPLETED'
    where w.entry_type = 'fiat_deposit'
      and not exists (
        select 1 from wallet_ledger_entries r
        where r.entry_type = 'fiat_deposit_reversal'
          and (r.meta->>'fiatDepositRef') = (w.meta->>'fiatDepositRef')
          and r.user_id = w.user_id
      )
  `);
  return rows as unknown as PhantomDepositRow[];
}

/** Reverse fiat_deposit ledger + debit user when FreshPay never confirmed funds. */
export async function reversePhantomFiatDeposits(opts: {
  dryRun?: boolean;
  reverifyCompleted?: boolean;
} = {}): Promise<{
  dryRun: boolean;
  reversed: PhantomDepositRow[];
  revertedTxStatus: string[];
}> {
  const dryRun = Boolean(opts.dryRun);
  const reverify = opts.reverifyCompleted !== false;
  const toReverse: PhantomDepositRow[] = [...(await listPhantomFiatDepositCredits())];
  const revertedTxStatus: string[] = [];

  if (reverify) {
    const completed = await listCompletedDepositsToReverify();
    for (const row of completed) {
      if (!row.ref) continue;
      try {
        const remote = await freshpayVerify(row.ref);
        const mapped = mapFreshpayVerifyStatus(remote);
        if (mapped !== "COMPLETED") {
          toReverse.push(row);
          if (!dryRun) {
            await getDb()
              .update(fiatFreshpayTransactions)
              .set({
                status: mapped === "FAILED" ? "FAILED" : "PROCESSING",
                updatedAt: new Date(),
                completedAt: null,
              })
              .where(eq(fiatFreshpayTransactions.reference, row.ref));
          }
          revertedTxStatus.push(row.ref);
        }
      } catch {
        toReverse.push(row);
        revertedTxStatus.push(row.ref);
      }
    }
  }

  const seen = new Set<string>();
  const unique = toReverse.filter((r) => {
    const key = `${r.userId}:${r.ref ?? r.ledgerId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!dryRun && unique.length > 0) {
    const db = getDb();
    await db.transaction(async (tx) => {
      for (const row of unique) {
        const amt = Number(row.amount);
        if (!Number.isFinite(amt) || amt <= 0) continue;
        const asset = row.asset as WalletAsset;
        const amtStr = fmtWalletAmount(amt);
        await debitUserAsset(tx, row.userId, asset, amtStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId: randomUUID(),
            userId: row.userId,
            entryType: "fiat_deposit_reversal",
            asset: row.asset,
            amount: `-${amtStr}`,
            feeUsdEquivalent: "0",
            meta: {
              fiatDepositRef: row.ref,
              reason: "phantom_fiat_deposit",
              originalLedgerId: row.ledgerId,
            },
          },
        ]);
      }
    });
  }

  return { dryRun, reversed: unique, revertedTxStatus };
}

/** Full fiat integrity pass: reverse phantom credits, then clamp orphan balances. */
export async function runFiatIntegrityReconcile(opts: { dryRun?: boolean } = {}) {
  const phantom = await reversePhantomFiatDeposits({
    dryRun: opts.dryRun,
    reverifyCompleted: true,
  });
  const balances = await reconcileAllOrphanBalances({ dryRun: opts.dryRun });
  const orphanFiat = await findFiatDepositsWithoutCompletedTx();
  return { phantom, balances, orphanFiatLedgerRows: orphanFiat.length, orphanFiat };
}
