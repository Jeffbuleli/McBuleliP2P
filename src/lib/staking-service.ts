import { and, asc, eq, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, userStakes, users } from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import {
  aprForTerm,
  isAllowedStakingTerm,
  stakingMinPrincipal,
  type StakingChainAsset,
} from "@/lib/staking-config";
import { accruedRewardLinear, maturityRewardAmount } from "@/lib/staking-math";
import { assetAmountToUsd } from "@/lib/wallet-convert";
import { fetchReferenceRates } from "@/lib/reference-rates";
import { fmtWalletAmount, numFromNumeric, type WalletAsset } from "@/lib/wallet-types";

const STAKE_ACTIVE = "active";
const STAKE_COMPLETED = "completed";

function asWalletAsset(asset: string): WalletAsset {
  return asset === "PI" ? "PI" : "USDT";
}

export async function processMaturedStakesForUser(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    const matured = await tx
      .select()
      .from(userStakes)
      .where(
        and(
          eq(userStakes.userId, userId),
          eq(userStakes.status, STAKE_ACTIVE),
          lte(userStakes.endsAt, now),
        ),
      );

    if (matured.length === 0) {
      return;
    }

    for (const s of matured) {
      const principal = Number(s.principal);
      const apr = Number(s.aprAnnual);
      const term = s.termDays;
      const reward = maturityRewardAmount(principal, apr, term);
      const rewardStr = fmtWalletAmount(reward);
      const prStr = s.principal.toString();
      const asset = asWalletAsset(s.asset);
      const batchId = randomUUID();

      const [upd] = await tx
        .update(userStakes)
        .set({
          status: STAKE_COMPLETED,
          interestPaid: rewardStr,
        })
        .where(
          and(eq(userStakes.id, s.id), eq(userStakes.status, STAKE_ACTIVE)),
        )
        .returning({ id: userStakes.id });

      if (!upd) {
        continue;
      }

      await creditUserAsset(tx, userId, asset, prStr);
      await creditUserAsset(tx, userId, asset, rewardStr);

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId,
          entryType: "stake_principal_return",
          asset: s.asset,
          amount: prStr,
          feeUsdEquivalent: "0",
          meta: { stakeId: s.id },
        },
        {
          batchId,
          userId,
          entryType: "stake_interest_payment",
          asset: s.asset,
          amount: rewardStr,
          feeUsdEquivalent: "0",
          meta: { stakeId: s.id, aprAnnual: apr, termDays: term },
        },
      ]);
    }
  });
}

export async function createStake(args: {
  userId: string;
  asset: StakingChainAsset;
  principalStr: string;
  termDays: number;
}): Promise<{ ok: true; stakeId: string } | { ok: false; message: string }> {
  const apr = aprForTerm(args.asset, args.termDays);
  if (apr == null || !isAllowedStakingTerm(args.asset, args.termDays)) {
    return { ok: false, message: "staking_invalid_term" };
  }
  const principal = Number(args.principalStr);
  if (!Number.isFinite(principal) || principal <= 0) {
    return { ok: false, message: "staking_invalid_amount" };
  }
  const min = stakingMinPrincipal(args.asset);
  if (principal + 1e-12 < min) {
    return { ok: false, message: "staking_below_minimum" };
  }

  const prStr = fmtWalletAmount(principal);
  const aprStr = apr.toFixed(4);
  const started = new Date();
  const endsAt = new Date(started.getTime() + args.termDays * 86_400_000);

  const db = getDb();
  try {
    const stakeId = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({
          balance: users.balance,
          piBalance: users.piBalance,
        })
        .from(users)
        .where(eq(users.id, args.userId));

      if (!u) {
        throw new Error("wallet_not_found");
      }
      const bal =
        args.asset === "USDT"
          ? numFromNumeric(u.balance)
          : numFromNumeric(u.piBalance);
      if (bal + 1e-18 < principal) {
        throw new Error("wallet_insufficient_balance");
      }

      await debitUserAsset(tx, args.userId, args.asset, prStr);

      const [row] = await tx
        .insert(userStakes)
        .values({
          userId: args.userId,
          asset: args.asset,
          principal: prStr,
          aprAnnual: aprStr,
          termDays: args.termDays,
          startedAt: started,
          endsAt,
          status: STAKE_ACTIVE,
        })
        .returning({ id: userStakes.id });

      const id = row?.id;
      if (!id) throw new Error("staking_create_failed");

      const batchId = randomUUID();
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "stake_lock",
          asset: args.asset,
          amount: `-${prStr}`,
          feeUsdEquivalent: "0",
          meta: {
            stakeId: id,
            termDays: args.termDays,
            aprAnnual: apr,
            endsAt: endsAt.toISOString(),
          },
        },
      ]);

      return id;
    });
    return { ok: true, stakeId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "staking_create_failed";
    if (msg === "wallet_not_found") return { ok: false, message: msg };
    if (msg === "wallet_insufficient_balance") {
      return { ok: false, message: msg };
    }
    return { ok: false, message: "staking_create_failed" };
  }
}

export type StakingStakeRow = {
  id: string;
  asset: string;
  principal: string;
  aprAnnual: string;
  termDays: number;
  startedAt: string;
  endsAt: string;
  status: string;
};

export async function listActiveStakes(userId: string): Promise<StakingStakeRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(userStakes)
    .where(and(eq(userStakes.userId, userId), eq(userStakes.status, STAKE_ACTIVE)))
    .orderBy(asc(userStakes.endsAt));

  return rows.map((r) => ({
    id: r.id,
    asset: r.asset,
    principal: r.principal.toString(),
    aprAnnual: r.aprAnnual.toString(),
    termDays: r.termDays,
    startedAt: r.startedAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    status: r.status,
  }));
}

export async function getStakingValuationUsd(userId: string): Promise<{
  principalUsd: number;
  accruedInterestUsd: number;
  maturityInterestUsd: number;
  activeCount: number;
}> {
  await processMaturedStakesForUser(userId);
  const rates = await fetchReferenceRates();
  const stakes = await listActiveStakes(userId);
  let principalUsd = 0;
  let accruedInterestUsd = 0;
  let maturityInterestUsd = 0;
  for (const s of stakes) {
    const p = Number(s.principal);
    const asset = asWalletAsset(s.asset);
    principalUsd += assetAmountToUsd(p, asset, rates);
    const apr = Number(s.aprAnnual);
    const fullReward = maturityRewardAmount(p, apr, s.termDays);
    maturityInterestUsd += assetAmountToUsd(fullReward, asset, rates);
    const acc = accruedRewardLinear(
      p,
      apr,
      s.termDays,
      new Date(s.startedAt),
      new Date(s.endsAt),
    );
    accruedInterestUsd += assetAmountToUsd(acc, asset, rates);
  }
  return {
    principalUsd,
    accruedInterestUsd,
    maturityInterestUsd,
    activeCount: stakes.length,
  };
}
