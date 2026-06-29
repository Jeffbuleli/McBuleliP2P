import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  deposits,
  fiatFreshpayTransactions,
  getDb,
  users,
  walletLedgerEntries,
} from "@/db";
import { DepositStatus } from "@/lib/status";
import { freshpayVerify, mapFreshpayVerifyStatus } from "@/lib/freshpay/provider";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import type { WalletAsset } from "@/lib/wallet-types";

const TOL = 1e-6;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbLike = any;

export type BalanceAuditRow = {
  userId: string;
  asset: WalletAsset;
  stored: number;
  expected: number;
  trusted: number;
  delta: number;
  orphan: boolean;
  untrusted: number;
};

export type BalanceProvenanceLine = {
  entryType: string;
  asset: string;
  amount: number;
  createdAt: string;
  batchId: string;
  trusted: boolean;
  reason: string;
  ref: string | null;
};

export type UserBalanceProvenance = {
  userId: string;
  assets: Record<
    WalletAsset,
    {
      stored: number;
      ledgerSum: number;
      trusted: number;
      cryptoConfirmed: number;
      untrustedDelta: number;
      lines: BalanceProvenanceLine[];
    }
  >;
};

function metaStr(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

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

async function completedFiatDepositRefSet(refs: string[]): Promise<Set<string>> {
  if (refs.length === 0) return new Set();
  const db = getDb();
  const rows = await db
    .select({ reference: fiatFreshpayTransactions.reference })
    .from(fiatFreshpayTransactions)
    .where(
      and(
        inArray(fiatFreshpayTransactions.reference, refs),
        eq(fiatFreshpayTransactions.kind, "deposit"),
        eq(fiatFreshpayTransactions.status, "COMPLETED"),
      ),
    );
  return new Set(rows.map((r) => r.reference));
}

async function confirmedCryptoDepositIdSet(userId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select({ id: deposits.id })
    .from(deposits)
    .where(
      and(eq(deposits.userId, userId), eq(deposits.status, DepositStatus.CONFIRMED)),
    );
  return new Set(rows.map((r) => r.id));
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

type ReplayCtx = {
  verifiedFiatRefs: Set<string>;
  confirmedCryptoIds: Set<string>;
  balances: Record<WalletAsset, number>;
  swapBatches: Map<string, { out?: LedgerLine; in?: LedgerLine }>;
};

type LedgerLine = {
  id: string;
  batchId: string;
  entryType: string;
  asset: string;
  amount: number;
  meta: Record<string, unknown> | null;
  createdAt: Date;
};

function emptyBalances(): Record<WalletAsset, number> {
  return { USDT: 0, PI: 0, USD: 0, CDF: 0, PI_TEST: 0 };
}

function isWalletAssetKey(a: string): a is WalletAsset {
  return a === "USDT" || a === "PI" || a === "USD" || a === "CDF" || a === "PI_TEST";
}

function classifyLedgerTrust(
  line: LedgerLine,
  ctx: ReplayCtx,
): { trusted: boolean; reason: string } {
  const ref = metaStr(line.meta, "fiatDepositRef");
  const sourceRef = metaStr(line.meta, "sourceRef");

  if (line.entryType === "fiat_deposit") {
    if (!ref) return { trusted: false, reason: "fiat_deposit_missing_ref" };
    if (!ctx.verifiedFiatRefs.has(ref)) {
      return { trusted: false, reason: "fiat_deposit_not_completed" };
    }
    return { trusted: true, reason: "freshpay_completed" };
  }

  if (line.entryType === "fiat_deposit_reversal") {
    return { trusted: true, reason: "phantom_reversal" };
  }

  if (line.entryType === "deposit_launch_reward") {
    if (!sourceRef) return { trusted: false, reason: "launch_reward_missing_source" };
    if (ctx.verifiedFiatRefs.has(sourceRef) || ctx.confirmedCryptoIds.has(sourceRef)) {
      return { trusted: true, reason: "launch_reward_verified_source" };
    }
    return { trusted: false, reason: "launch_reward_unverified_source" };
  }

  if (line.entryType === "deposit_launch_reward_reversal") {
    return { trusted: true, reason: "launch_reward_reversal" };
  }

  if (line.entryType === "top_trader_week_prize") {
    return { trusted: true, reason: "top_trader_week_prize" };
  }

  if (line.entryType === "swap_reversal") {
    return { trusted: true, reason: "swap_reversal" };
  }

  if (line.entryType === "swap_out" || line.entryType === "swap_in") {
    return { trusted: false, reason: "swap_pending_batch" };
  }

  return { trusted: true, reason: "ledger_entry" };
}

function applyAmount(
  balances: Record<WalletAsset, number>,
  asset: string,
  amount: number,
): boolean {
  if (!isWalletAssetKey(asset) || asset === "PI_TEST") return false;
  if (amount < 0) {
    const need = Math.abs(amount);
    if (balances[asset] + TOL < need) return false;
    balances[asset] -= need;
    return true;
  }
  balances[asset] += amount;
  return true;
}

function applySwapBatch(
  batch: { out?: LedgerLine; in?: LedgerLine },
  balances: Record<WalletAsset, number>,
): boolean {
  if (!batch.out) return false;
  const outAmt = Math.abs(batch.out.amount);
  const fromAsset = batch.out.asset;
  if (!isWalletAssetKey(fromAsset) || fromAsset === "PI_TEST") return false;
  if (balances[fromAsset] + TOL < outAmt) return false;

  balances[fromAsset] -= outAmt;
  if (batch.in && isWalletAssetKey(batch.in.asset) && batch.in.asset !== "PI_TEST") {
    balances[batch.in.asset] += batch.in.amount;
  }
  return true;
}

/** Replay ledger with trust filter - only credits from verified PSP / confirmed crypto chains. */
export async function replayTrustedBalances(userId: string): Promise<Record<WalletAsset, number>> {
  const db = getDb();
  const rows = await db
    .select({
      id: walletLedgerEntries.id,
      batchId: walletLedgerEntries.batchId,
      entryType: walletLedgerEntries.entryType,
      asset: walletLedgerEntries.asset,
      amount: walletLedgerEntries.amount,
      meta: walletLedgerEntries.meta,
      createdAt: walletLedgerEntries.createdAt,
    })
    .from(walletLedgerEntries)
    .where(eq(walletLedgerEntries.userId, userId))
    .orderBy(walletLedgerEntries.createdAt);

  const fiatRefs = rows
    .map((r) => metaStr(r.meta, "fiatDepositRef"))
    .filter((r): r is string => Boolean(r));
  const launchRefs = rows
    .map((r) => metaStr(r.meta, "sourceRef"))
    .filter((r): r is string => Boolean(r));

  const verifiedFiatRefs = await completedFiatDepositRefSet([...fiatRefs, ...launchRefs]);
  const confirmedCryptoIds = await confirmedCryptoDepositIdSet(userId);

  const ctx: ReplayCtx = {
    verifiedFiatRefs,
    confirmedCryptoIds,
    balances: emptyBalances(),
    swapBatches: new Map(),
  };

  for (const r of rows) {
    const line: LedgerLine = {
      id: r.id,
      batchId: r.batchId,
      entryType: r.entryType,
      asset: r.asset,
      amount: Number(r.amount),
      meta: r.meta,
      createdAt: r.createdAt,
    };

    if (line.entryType === "swap_out" || line.entryType === "swap_in") {
      const batch = ctx.swapBatches.get(line.batchId) ?? {};
      if (line.entryType === "swap_out") batch.out = line;
      else batch.in = line;
      ctx.swapBatches.set(line.batchId, batch);
      continue;
    }

    // Flush pending swap batches before non-swap entry.
    for (const [, batch] of ctx.swapBatches) {
      applySwapBatch(batch, ctx.balances);
    }
    ctx.swapBatches.clear();

    const { trusted } = classifyLedgerTrust(line, ctx);
    if (!trusted) continue;
    applyAmount(ctx.balances, line.asset, line.amount);
  }

  for (const [, batch] of ctx.swapBatches) {
    applySwapBatch(batch, ctx.balances);
  }

  const cryptoUsdt = await sumConfirmedCryptoDeposits(userId, "USDT");
  const cryptoPi = await sumConfirmedCryptoDeposits(userId, "PI");
  ctx.balances.USDT += cryptoUsdt;
  ctx.balances.PI += cryptoPi;

  for (const k of Object.keys(ctx.balances) as WalletAsset[]) {
    if (ctx.balances[k] < 0 && ctx.balances[k] > -TOL) ctx.balances[k] = 0;
  }

  return ctx.balances;
}

export async function traceUserBalanceProvenance(userId: string): Promise<UserBalanceProvenance> {
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

  const storedMap: Record<WalletAsset, number> = {
    USDT: numFromNumeric(u?.balance),
    PI: numFromNumeric(u?.piBalance),
    USD: numFromNumeric(u?.usdBalance),
    CDF: numFromNumeric(u?.cdfBalance),
    PI_TEST: 0,
  };

  const rows = await db
    .select({
      id: walletLedgerEntries.id,
      batchId: walletLedgerEntries.batchId,
      entryType: walletLedgerEntries.entryType,
      asset: walletLedgerEntries.asset,
      amount: walletLedgerEntries.amount,
      meta: walletLedgerEntries.meta,
      createdAt: walletLedgerEntries.createdAt,
    })
    .from(walletLedgerEntries)
    .where(eq(walletLedgerEntries.userId, userId))
    .orderBy(walletLedgerEntries.createdAt);

  const fiatRefs = rows
    .map((r) => metaStr(r.meta, "fiatDepositRef"))
    .filter((r): r is string => Boolean(r));
  const launchRefs = rows
    .map((r) => metaStr(r.meta, "sourceRef"))
    .filter((r): r is string => Boolean(r));
  const verifiedFiatRefs = await completedFiatDepositRefSet([...fiatRefs, ...launchRefs]);
  const confirmedCryptoIds = await confirmedCryptoDepositIdSet(userId);

  const ctx: ReplayCtx = {
    verifiedFiatRefs,
    confirmedCryptoIds,
    balances: emptyBalances(),
    swapBatches: new Map(),
  };

  const lines: BalanceProvenanceLine[] = [];
  const assets: WalletAsset[] = ["USDT", "PI", "USD", "CDF"];

  const flushSwaps = () => {
    for (const [batchId, batch] of ctx.swapBatches) {
      const ok = applySwapBatch(batch, ctx.balances);
      const out = batch.out;
      const inn = batch.in;
      if (out) {
        lines.push({
          entryType: "swap_out",
          asset: out.asset,
          amount: out.amount,
          createdAt: out.createdAt.toISOString(),
          batchId,
          trusted: ok,
          reason: ok ? "swap_funded" : "swap_unfunded",
          ref: metaStr(out.meta, "fiatDepositRef"),
        });
      }
      if (inn) {
        lines.push({
          entryType: "swap_in",
          asset: inn.asset,
          amount: inn.amount,
          createdAt: inn.createdAt.toISOString(),
          batchId,
          trusted: ok,
          reason: ok ? "swap_funded" : "swap_unfunded",
          ref: null,
        });
      }
    }
    ctx.swapBatches.clear();
  };

  for (const r of rows) {
    const line: LedgerLine = {
      id: r.id,
      batchId: r.batchId,
      entryType: r.entryType,
      asset: r.asset,
      amount: Number(r.amount),
      meta: r.meta,
      createdAt: r.createdAt,
    };

    if (line.entryType === "swap_out" || line.entryType === "swap_in") {
      const batch = ctx.swapBatches.get(line.batchId) ?? {};
      if (line.entryType === "swap_out") batch.out = line;
      else batch.in = line;
      ctx.swapBatches.set(line.batchId, batch);
      continue;
    }

    flushSwaps();

    const { trusted, reason } = classifyLedgerTrust(line, ctx);
    const applied =
      trusted && applyAmount(ctx.balances, line.asset, line.amount);
    if (trusted && !applied && line.amount < 0) {
      /* debit skipped - insufficient trusted balance */
    } else if (trusted) {
      applyAmount(ctx.balances, line.asset, line.amount);
    }

    lines.push({
      entryType: line.entryType,
      asset: line.asset,
      amount: line.amount,
      createdAt: line.createdAt.toISOString(),
      batchId: line.batchId,
      trusted: trusted && (line.amount >= 0 || applied),
      reason,
      ref: metaStr(line.meta, "fiatDepositRef") ?? metaStr(line.meta, "sourceRef"),
    });
  }
  flushSwaps();

  const cryptoUsdt = await sumConfirmedCryptoDeposits(userId, "USDT");
  const cryptoPi = await sumConfirmedCryptoDeposits(userId, "PI");
  ctx.balances.USDT += cryptoUsdt;
  ctx.balances.PI += cryptoPi;

  const trusted = await replayTrustedBalances(userId);
  const out: UserBalanceProvenance = { userId, assets: {} as UserBalanceProvenance["assets"] };

  for (const asset of assets) {
    const ledgerSum = await sumLedger(userId, asset);
    const cryptoConfirmed =
      asset === "USDT" ? cryptoUsdt : asset === "PI" ? cryptoPi : 0;
    out.assets[asset] = {
      stored: storedMap[asset],
      ledgerSum,
      trusted: trusted[asset],
      cryptoConfirmed,
      untrustedDelta: storedMap[asset] - trusted[asset],
      lines: lines.filter((l) => l.asset === asset),
    };
  }

  return out;
}

export async function traceUsersWithUntrustedFunds(): Promise<
  { userId: string; asset: WalletAsset; stored: number; trusted: number; delta: number }[]
> {
  const db = getDb();
  const userRows = await db.select({ id: users.id }).from(users);
  const out: { userId: string; asset: WalletAsset; stored: number; trusted: number; delta: number }[] =
    [];

  for (const u of userRows) {
    const prov = await traceUserBalanceProvenance(u.id);
    for (const asset of ["USDT", "PI", "USD", "CDF"] as WalletAsset[]) {
      const row = prov.assets[asset];
      if (row.untrustedDelta > TOL) {
        out.push({
          userId: u.id,
          asset,
          stored: row.stored,
          trusted: row.trusted,
          delta: row.untrustedDelta,
        });
      }
    }
  }
  return out;
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

  const trustedMap = await replayTrustedBalances(userId);
  const rows: BalanceAuditRow[] = [];

  for (const asset of assets) {
    const stored = storedMap[asset];
    const expected = await expectedWalletBalance(userId, asset);
    const trusted = trustedMap[asset];
    const delta = stored - expected;
    const untrusted = stored - trusted;
    rows.push({
      userId,
      asset,
      stored,
      expected,
      trusted,
      delta,
      orphan: delta > TOL,
      untrusted,
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
    out.push(...rows.filter((r) => r.orphan || Math.abs(r.untrusted) > TOL));
  }
  return out;
}

/** Remove orphan balance (stored > expected) - never inflates balances. */
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

/** Align stored balances to trusted replay (removes phantom + swap residue). */
export async function reconcileToTrustedBalances(opts: {
  dryRun?: boolean;
  userId?: string;
} = {}): Promise<{ users: number; rows: BalanceAuditRow[]; dryRun: boolean }> {
  const db = getDb();
  const userRows = opts.userId
    ? [{ id: opts.userId }]
    : await db.select({ id: users.id }).from(users);

  const allFixed: BalanceAuditRow[] = [];
  let usersFixed = 0;

  for (const u of userRows) {
    const audits = await auditUserBalances(u.id);
    const drift = audits.filter((row) => {
      if (row.stored - row.trusted > TOL) return true;
      if (row.stored < -TOL) return true;
      return false;
    });
    if (drift.length === 0) continue;

    allFixed.push(...drift);
    if (opts.dryRun) continue;

    usersFixed += 1;
    await db.transaction(async (tx) => {
      for (const row of drift) {
        const target = fmtWalletAmount(Math.max(0, row.trusted));
        if (row.asset === "USDT") {
          await tx.update(users).set({ balance: target }).where(eq(users.id, u.id));
        } else if (row.asset === "PI") {
          await tx.update(users).set({ piBalance: target }).where(eq(users.id, u.id));
        } else if (row.asset === "USD") {
          await tx.update(users).set({ usdBalance: target }).where(eq(users.id, u.id));
        } else if (row.asset === "CDF") {
          await tx.update(users).set({ cdfBalance: target }).where(eq(users.id, u.id));
        }
      }
    });
  }

  return { users: usersFixed, rows: allFixed, dryRun: Boolean(opts.dryRun) };
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
  { userId: string; ref: string | null; amount: string; asset: string }[]
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
  return rows as unknown as { userId: string; ref: string | null; amount: string; asset: string }[];
}

type PhantomDepositRow = {
  ledgerId: string;
  userId: string;
  asset: string;
  amount: string;
  ref: string | null;
  txStatus: string | null;
  createdAt: Date;
};

type SwapBatchRow = {
  batchId: string;
  userId: string;
  outAsset: string;
  outAmount: string;
  inAsset: string;
  inAmount: string;
};

async function listPhantomFiatDepositCredits(since?: Date): Promise<PhantomDepositRow[]> {
  const db = getDb();
  const sinceClause = since
    ? sql`and w.created_at >= ${since}`
    : sql``;
  const rows = await db.execute(sql`
    select w.id as "ledgerId",
           w.user_id as "userId",
           w.asset,
           w.amount,
           w.meta->>'fiatDepositRef' as ref,
           f.status as "txStatus",
           w.created_at as "createdAt"
    from wallet_ledger_entries w
    left join fiat_freshpay_transactions f
      on f.reference = (w.meta->>'fiatDepositRef')
     and f.kind = 'deposit'
    where w.entry_type = 'fiat_deposit'
      and not exists (
        select 1 from wallet_ledger_entries r
        where r.entry_type = 'fiat_deposit_reversal'
          and r.user_id = w.user_id
          and (
            (r.meta->>'fiatDepositRef') = (w.meta->>'fiatDepositRef')
            or (r.meta->>'originalLedgerId') = w.id::text
          )
      )
      and (
        f.reference is null
        or f.status in ('PROCESSING', 'INITIATED', 'FAILED')
      )
      ${sinceClause}
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
           f.status as "txStatus",
           w.created_at as "createdAt"
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

async function findSwapBatchesToUnwind(args: {
  userId: string;
  asset: string;
  since: Date;
  maxOutTotal: number;
}): Promise<SwapBatchRow[]> {
  const db = getDb();
  const rows = await db.execute(sql`
    select so.batch_id as "batchId",
           so.user_id as "userId",
           so.asset as "outAsset",
           so.amount as "outAmount",
           si.asset as "inAsset",
           si.amount as "inAmount"
    from wallet_ledger_entries so
    join wallet_ledger_entries si
      on si.batch_id = so.batch_id
     and si.entry_type = 'swap_in'
    where so.user_id = ${args.userId}
      and so.entry_type = 'swap_out'
      and so.asset = ${args.asset}
      and so.created_at >= ${args.since}
      and not exists (
        select 1 from wallet_ledger_entries sr
        where sr.entry_type = 'swap_reversal'
          and (sr.meta->>'originalBatchId') = so.batch_id::text
          and sr.user_id = so.user_id
      )
    order by so.created_at asc
  `);

  const batches = rows as unknown as SwapBatchRow[];
  const picked: SwapBatchRow[] = [];
  let total = 0;
  for (const b of batches) {
    const out = Math.abs(Number(b.outAmount));
    if (!Number.isFinite(out) || out <= 0) continue;
    picked.push(b);
    total += out;
    if (total + TOL >= args.maxOutTotal) break;
  }
  return picked;
}

async function findOrphanSwapsAfterReversedPhantom(): Promise<SwapBatchRow[]> {
  const db = getDb();
  const rows = await db.execute(sql`
    select so.batch_id as "batchId",
           so.user_id as "userId",
           so.asset as "outAsset",
           so.amount as "outAmount",
           si.asset as "inAsset",
           si.amount as "inAmount"
    from wallet_ledger_entries so
    join wallet_ledger_entries si
      on si.batch_id = so.batch_id
     and si.entry_type = 'swap_in'
    where so.entry_type = 'swap_out'
      and not exists (
        select 1 from wallet_ledger_entries sr
        where sr.entry_type = 'swap_reversal'
          and (sr.meta->>'originalBatchId') = so.batch_id::text
          and sr.user_id = so.user_id
      )
      and exists (
        select 1
        from wallet_ledger_entries dep
        left join fiat_freshpay_transactions f
          on f.reference = (dep.meta->>'fiatDepositRef')
         and f.kind = 'deposit'
        where dep.entry_type = 'fiat_deposit'
          and dep.user_id = so.user_id
          and dep.asset = so.asset
          and dep.created_at <= so.created_at
          and (
            f.reference is null
            or f.status is distinct from 'COMPLETED'
          )
      )
    order by so.created_at asc
  `);
  return rows as unknown as SwapBatchRow[];
}

async function reverseSwapBatches(
  batches: SwapBatchRow[],
  reason: string,
  tx: DbLike,
): Promise<number> {
  let n = 0;
  for (const b of batches) {
    const outAmt = Math.abs(Number(b.outAmount));
    const inAmt = Number(b.inAmount);
    if (!Number.isFinite(outAmt) || outAmt <= 0 || !Number.isFinite(inAmt) || inAmt <= 0) {
      continue;
    }
    const outStr = fmtWalletAmount(outAmt);
    const inStr = fmtWalletAmount(inAmt);
    const outAsset = b.outAsset as WalletAsset;
    const inAsset = b.inAsset as WalletAsset;

    await debitUserAsset(tx, b.userId, inAsset, inStr);
    await creditUserAsset(tx, b.userId, outAsset, outStr);

    await insertWalletLedgerLines(tx, [
      {
        batchId: randomUUID(),
        userId: b.userId,
        entryType: "swap_reversal",
        asset: inAsset,
        amount: `-${inStr}`,
        feeUsdEquivalent: "0",
        meta: { originalBatchId: b.batchId, reason, leg: "swap_in" },
      },
      {
        batchId: randomUUID(),
        userId: b.userId,
        entryType: "swap_reversal",
        asset: outAsset,
        amount: outStr,
        feeUsdEquivalent: "0",
        meta: { originalBatchId: b.batchId, reason, leg: "swap_out" },
      },
    ]);
    n += 1;
  }
  return n;
}

async function reverseLaunchRewardsForRef(
  ref: string | null,
  userId: string,
  tx: DbLike,
): Promise<number> {
  if (!ref) return 0;
  const db = getDb();
  const rows = await db
    .select({
      id: walletLedgerEntries.id,
      batchId: walletLedgerEntries.batchId,
      amount: walletLedgerEntries.amount,
    })
    .from(walletLedgerEntries)
    .where(
      and(
        eq(walletLedgerEntries.userId, userId),
        eq(walletLedgerEntries.entryType, "deposit_launch_reward"),
        sql`(${walletLedgerEntries.meta} ->> 'sourceRef') = ${ref}`,
      ),
    );

  let n = 0;
  for (const row of rows) {
    const [already] = await tx
      .select({ id: walletLedgerEntries.id })
      .from(walletLedgerEntries)
      .where(
        and(
          eq(walletLedgerEntries.userId, userId),
          eq(walletLedgerEntries.entryType, "deposit_launch_reward_reversal"),
          sql`(${walletLedgerEntries.meta} ->> 'sourceRef') = ${ref}`,
        ),
      )
      .limit(1);
    if (already) continue;

    const amt = Number(row.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    const amtStr = fmtWalletAmount(amt);
    await debitUserAsset(tx, userId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId: randomUUID(),
        userId,
        entryType: "deposit_launch_reward_reversal",
        asset: "USDT",
        amount: `-${amtStr}`,
        feeUsdEquivalent: "0",
        meta: { sourceRef: ref, reason: "phantom_fiat_cascade", originalLedgerId: row.id },
      },
    ]);
    n += 1;
  }
  return n;
}

async function cascadePhantomUnwind(
  phantom: PhantomDepositRow,
  tx: DbLike,
): Promise<{ swaps: number; launchRewards: number }> {
  const amt = Number(phantom.amount);
  const since = phantom.createdAt;
  const swaps = await findSwapBatchesToUnwind({
    userId: phantom.userId,
    asset: phantom.asset,
    since,
    maxOutTotal: Number.isFinite(amt) ? amt : 0,
  });
  const swapN = await reverseSwapBatches(swaps, "phantom_fiat_cascade", tx);
  const launchN = await reverseLaunchRewardsForRef(phantom.ref, phantom.userId, tx);
  return { swaps: swapN, launchRewards: launchN };
}

/** Reverse fiat_deposit ledger + debit user when FreshPay never confirmed funds. */
export async function reversePhantomFiatDeposits(opts: {
  dryRun?: boolean;
  reverifyCompleted?: boolean;
  sinceHours?: number;
} = {}): Promise<{
  dryRun: boolean;
  reversed: PhantomDepositRow[];
  revertedTxStatus: string[];
  cascadedSwaps: number;
  cascadedLaunchRewards: number;
  repairedOrphanSwaps: number;
}> {
  const dryRun = Boolean(opts.dryRun);
  const reverify = opts.reverifyCompleted !== false;
  const since =
    opts.sinceHours != null && opts.sinceHours > 0
      ? new Date(Date.now() - opts.sinceHours * 3600_000)
      : undefined;

  const toReverse: PhantomDepositRow[] = [...(await listPhantomFiatDepositCredits(since))];
  const revertedTxStatus: string[] = [];

  if (reverify) {
    const completed = await listCompletedDepositsToReverify();
    for (const row of completed) {
      if (since && row.createdAt < since) continue;
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

  let cascadedSwaps = 0;
  let cascadedLaunchRewards = 0;
  let repairedOrphanSwaps = 0;

  if (!dryRun) {
    const db = getDb();
    await db.transaction(async (tx) => {
      for (const row of unique) {
        const cascade = await cascadePhantomUnwind(row, tx);
        cascadedSwaps += cascade.swaps;
        cascadedLaunchRewards += cascade.launchRewards;

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

      const orphanSwaps = await findOrphanSwapsAfterReversedPhantom();
      repairedOrphanSwaps = await reverseSwapBatches(
        orphanSwaps,
        "phantom_fiat_repair",
        tx,
      );
    });
  } else {
    for (const row of unique) {
      const swaps = await findSwapBatchesToUnwind({
        userId: row.userId,
        asset: row.asset,
        since: row.createdAt,
        maxOutTotal: Number(row.amount),
      });
      cascadedSwaps += swaps.length;
      if (row.ref) cascadedLaunchRewards += 1;
    }
    const orphanSwaps = await findOrphanSwapsAfterReversedPhantom();
    repairedOrphanSwaps = orphanSwaps.length;
  }

  return {
    dryRun,
    reversed: unique,
    revertedTxStatus,
    cascadedSwaps,
    cascadedLaunchRewards,
    repairedOrphanSwaps,
  };
}

/** Full fiat integrity pass: reverse phantom credits, cascade swaps, align trusted balances. */
export async function runFiatIntegrityReconcile(opts: {
  dryRun?: boolean;
  sinceHours?: number;
} = {}) {
  const phantom = await reversePhantomFiatDeposits({
    dryRun: opts.dryRun,
    reverifyCompleted: true,
    sinceHours: opts.sinceHours,
  });
  const trusted = await reconcileToTrustedBalances({ dryRun: opts.dryRun });
  const balances = await reconcileAllOrphanBalances({ dryRun: opts.dryRun });
  const orphanFiat = await findFiatDepositsWithoutCompletedTx();
  const untrustedUsers = opts.dryRun
    ? await traceUsersWithUntrustedFunds()
    : [];

  return {
    phantom,
    trusted,
    balances,
    orphanFiatLedgerRows: orphanFiat.length,
    orphanFiat,
    untrustedUsers,
  };
}
