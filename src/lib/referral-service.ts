import { and, count, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb, deposits, referralFirstRewards, users } from "@/db";
import { DepositStatus } from "@/lib/status";
import { fetchReferenceRates } from "@/lib/reference-rates";
import {
  REFERRAL_CRYPTO_DEPOSIT_NOTIONAL_FEE_RATE,
  REFERRAL_FIRST_DEPOSIT_FEE_SHARE_TO_REFERRER,
  REFERRAL_MIN_FIRST_DEPOSIT_USD,
  REFERRAL_USDT_FIRST_MIN_GROSS_USDT,
  REFERRAL_USDT_FIRST_REFERRER_REWARD_USDT,
} from "@/lib/referral-config";
import { cdfPerOneUsd } from "@/lib/fx";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomReferralCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

/** Ensures the user has a unique referral code (used before sharing / snapshot). */
export async function ensureUserReferralCode(userId: string): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ code: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 24; attempt++) {
    const code = randomReferralCode();
    try {
      const [row] = await db
        .update(users)
        .set({ referralCode: code })
        .where(and(eq(users.id, userId), isNull(users.referralCode)))
        .returning({ code: users.referralCode });
      if (row?.code) return row.code;
      const [again] = await db
        .select({ code: users.referralCode })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (again?.code) return again.code;
    } catch {
      /* unique referral_code collision — retry */
    }
  }
  throw new Error("referral_code_generation_failed");
}

export async function findReferrerByCode(
  code: string,
): Promise<{ id: string } | null> {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 4) return null;
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, normalized))
    .limit(1);
  return u ?? null;
}

/**
 * Award referrer on referee's first qualifying deposit (min gross USD unless overridden).
 * Default: half of **platform fee USD**. Optional **fixedRewardUsdt** (e.g. USDT on-chain promo).
 * Idempotent per referee via unique(referee_user_id).
 */
export async function tryAwardReferralFirstDeposit(args: {
  refereeUserId: string;
  grossDepositUsd: number;
  platformFeeUsd: number;
  source: string;
  meta?: Record<string, unknown>;
  /** Override default min gross (e.g. 20 USDT for on-chain USDT). */
  minGrossUsd?: number;
  /** When set, referrer receives exactly this USDT; ignores fee × share. */
  fixedRewardUsdt?: number;
}): Promise<void> {
  const { refereeUserId, grossDepositUsd, platformFeeUsd, source, meta } = args;
  const minGross = args.minGrossUsd ?? REFERRAL_MIN_FIRST_DEPOSIT_USD;
  if (!Number.isFinite(grossDepositUsd) || grossDepositUsd + 1e-9 < minGross) {
    return;
  }

  let rewardRaw: number;
  let feeStr: string;
  if (args.fixedRewardUsdt != null && args.fixedRewardUsdt > 0) {
    rewardRaw = args.fixedRewardUsdt;
    feeStr = fmtWalletAmount(platformFeeUsd);
  } else {
    if (!Number.isFinite(platformFeeUsd) || platformFeeUsd <= 1e-12) return;
    rewardRaw =
      platformFeeUsd * REFERRAL_FIRST_DEPOSIT_FEE_SHARE_TO_REFERRER;
    feeStr = fmtWalletAmount(platformFeeUsd);
  }

  const rewardStr = fmtWalletAmount(rewardRaw);
  const rewardNum = Number(rewardStr);
  if (!Number.isFinite(rewardNum) || rewardNum <= 0) return;

  const db = getDb();
  const [referee] = await db
    .select({ referredByUserId: users.referredByUserId })
    .from(users)
    .where(eq(users.id, refereeUserId))
    .limit(1);
  const referrerId = referee?.referredByUserId ?? null;
  if (!referrerId || referrerId === refereeUserId) return;

  await db.transaction(async (tx) => {
    const [dup] = await tx
      .select({ id: referralFirstRewards.id })
      .from(referralFirstRewards)
      .where(eq(referralFirstRewards.refereeUserId, refereeUserId))
      .limit(1);
    if (dup) return;

    await tx.insert(referralFirstRewards).values({
      refereeUserId,
      referrerUserId: referrerId,
      platformFeeUsd: feeStr,
      rewardUsdt: rewardStr,
      source,
      meta: meta ?? null,
    });

    await tx
      .update(users)
      .set({
        referralUsdtBalance: sql`${users.referralUsdtBalance} + ${rewardStr}::numeric`,
      })
      .where(eq(users.id, referrerId));
  });
}

/** Fiat mobile-money deposit (actual fee taken by platform). */
export async function tryAwardReferralFromFiatDeposit(args: {
  userId: string;
  grossAmount: number;
  currency: string;
  feeUsdEquivalentStr: string;
  fiatDepositRef: string;
}): Promise<void> {
  const cur = args.currency.toUpperCase();
  const grossUsd =
    cur === "USD"
      ? args.grossAmount
      : args.grossAmount / cdfPerOneUsd();
  const platformFeeUsd = Number(args.feeUsdEquivalentStr);
  await tryAwardReferralFirstDeposit({
    refereeUserId: args.userId,
    grossDepositUsd: grossUsd,
    platformFeeUsd,
    source: "fiat_mobile_money",
    meta: {
      fiatDepositRef: args.fiatDepositRef,
      gross: args.grossAmount,
      currency: cur,
      feeRate: FIAT_FEE_RATE,
    },
  });
}

/** @deprecated Use tryAwardReferralFromFiatDeposit */
export async function tryAwardReferralFromFiatPawapayDeposit(args: {
  userId: string;
  grossAmount: number;
  currency: string;
  feeUsdEquivalentStr: string;
  pawapayDepositId: string;
}): Promise<void> {
  return tryAwardReferralFromFiatDeposit({
    ...args,
    fiatDepositRef: args.pawapayDepositId,
  });
}

/** On-chain USDT: fixed $1 to referrer if first deposit gross ≥ 20 USDT; else no commission. PI: notional fee × share. */
export async function tryAwardReferralFromCryptoDeposit(args: {
  userId: string;
  depositId: string;
  asset: string;
  amountStr: string;
}): Promise<void> {
  const asset = args.asset.toUpperCase();
  const amountNum = Number(args.amountStr);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return;

  if (asset === "USDT") {
    const db = getDb();
    const [priorRow] = await db
      .select({ c: count() })
      .from(deposits)
      .where(
        and(
          eq(deposits.userId, args.userId),
          eq(deposits.asset, "USDT"),
          eq(deposits.status, DepositStatus.CONFIRMED),
          ne(deposits.id, args.depositId),
        ),
      );
    const priorUsdtDeposits = Number(priorRow?.c ?? 0);
    if (priorUsdtDeposits > 0) {
      return;
    }

    await tryAwardReferralFirstDeposit({
      refereeUserId: args.userId,
      grossDepositUsd: amountNum,
      platformFeeUsd: REFERRAL_USDT_FIRST_REFERRER_REWARD_USDT,
      source: "crypto_usdt",
      meta: {
        depositId: args.depositId,
        asset,
        amount: args.amountStr,
        rewardType: "usdt_first_fixed",
      },
      minGrossUsd: REFERRAL_USDT_FIRST_MIN_GROSS_USDT,
      fixedRewardUsdt: REFERRAL_USDT_FIRST_REFERRER_REWARD_USDT,
    });
    return;
  }

  let grossUsd = amountNum;
  if (asset === "PI") {
    const rates = await fetchReferenceRates();
    if (!(rates.piUsd > 0)) return;
    grossUsd = amountNum * rates.piUsd;
  }

  const platformFeeUsd = grossUsd * REFERRAL_CRYPTO_DEPOSIT_NOTIONAL_FEE_RATE;

  await tryAwardReferralFirstDeposit({
    refereeUserId: args.userId,
    grossDepositUsd: grossUsd,
    platformFeeUsd,
    source: "crypto_pi",
    meta: { depositId: args.depositId, asset, amount: args.amountStr },
  });
}

export async function getReferralSnapshot(userId: string): Promise<{
  code: string;
  linkPath: string;
  inviteLinkFull: string;
  referralBalanceUsdt: number;
  inviteCount: number;
  totalEarnedUsdt: number;
}> {
  const code = await ensureUserReferralCode(userId);
  const db = getDb();
  const [u] = await db
    .select({ referralUsdtBalance: users.referralUsdtBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const bal = numFromNumeric(u?.referralUsdtBalance?.toString() ?? "0");

  const [agg] = await db
    .select({
      c: sql<number>`count(*)::int`,
      sum: sql<string>`coalesce(sum(${referralFirstRewards.rewardUsdt})::text, '0')`,
    })
    .from(referralFirstRewards)
    .where(eq(referralFirstRewards.referrerUserId, userId));

  const totalEarnedUsdt = numFromNumeric(agg?.sum ?? "0");

  const linkPath = `/register?ref=${encodeURIComponent(code)}`;
  return {
    code,
    linkPath,
    inviteLinkFull: getAppAbsoluteUrl(linkPath),
    referralBalanceUsdt: bal,
    inviteCount: agg?.c ?? 0,
    totalEarnedUsdt,
  };
}
