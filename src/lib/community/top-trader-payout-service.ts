import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  communityUserProfiles,
  getDb,
  topTraderWeekPayouts,
  tradeFuturesPositions,
  users,
} from "@/db";
import {
  TOP_TRADER_PRIZE_USDT,
  getCompletedWeekForPayout,
} from "@/lib/community/top-trader-competition";
import { createUserNotification } from "@/lib/notifications-service";
import { fmtTradeAmount } from "@/lib/trade-math";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";

export type {
  AdminTopTraderPayoutRow,
  TopTraderWeekHistoryEntry,
  TopTraderWeekWinnerView,
} from "@/lib/community/top-trader-types";
import type {
  AdminTopTraderPayoutRow,
  TopTraderWeekHistoryEntry,
  TopTraderWeekWinnerView,
} from "@/lib/community/top-trader-types";

type WeekCandidate = {
  userId: string;
  weeklyPnl: number;
  tradeCount: number;
  kycStatus: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
};

async function loadWeekCandidates(args: {
  weekStartAt: Date;
  weekEndAt: Date;
}): Promise<WeekCandidate[]> {
  const db = getDb();

  const pnlRows = await db
    .select({
      userId: tradeFuturesPositions.userId,
      weeklyPnl: sql<string>`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`,
      tradeCount: sql<number>`count(*)::int`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.isDemo, true),
        eq(tradeFuturesPositions.isCompetition, true),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, args.weekStartAt),
        lte(tradeFuturesPositions.closedAt, args.weekEndAt),
      ),
    )
    .groupBy(tradeFuturesPositions.userId)
    .orderBy(
      desc(sql`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`),
      sql`count(*)::int asc`,
    );

  if (!pnlRows.length) return [];

  const userIds = pnlRows.map((r) => r.userId);

  const profileRows = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      userDisplayName: users.displayName,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId))
    .where(inArray(communityUserProfiles.userId, userIds));

  const profileMap = new Map<
    string,
    {
      userId: string;
      handle: string | null;
      displayName: string;
      avatarUrl: string | null;
      kycStatus: string;
      userDisplayName: string | null;
    }
  >(profileRows.map((p) => [p.userId, p]));

  const missingIds = userIds.filter((id) => !profileMap.has(id));
  if (missingIds.length) {
    const userRows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        kycStatus: users.kycStatus,
      })
      .from(users)
      .where(inArray(users.id, missingIds));
    for (const u of userRows) {
      profileMap.set(u.id, {
        userId: u.id,
        handle: null,
        displayName: u.displayName ?? "Trader",
        avatarUrl: u.avatarUrl,
        kycStatus: u.kycStatus,
        userDisplayName: u.displayName,
      });
    }
  }

  return pnlRows.map((row) => {
    const p = profileMap.get(row.userId);
    return {
      userId: row.userId,
      weeklyPnl: Number(row.weeklyPnl),
      tradeCount: Number(row.tradeCount),
      kycStatus: p?.kycStatus ?? "none",
      displayName: p?.displayName ?? p?.userDisplayName ?? "Trader",
      handle: p?.handle ?? null,
      avatarUrl: p?.avatarUrl ?? null,
    };
  });
}

function pickWinner(candidates: WeekCandidate[]): WeekCandidate | null {
  for (const c of candidates) {
    if (c.weeklyPnl <= 0) continue;
    if (c.kycStatus !== "approved") continue;
    return c;
  }
  return null;
}

export async function runTopTraderWeeklyPayout(now = new Date()): Promise<{
  ok: boolean;
  status: string;
  weekLabel?: string;
  winnerUserId?: string;
  prizeUsdt?: number;
  message?: string;
}> {
  const window = getCompletedWeekForPayout(now);
  if (!window) {
    return { ok: true, status: "skipped", message: "no_completed_week" };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(topTraderWeekPayouts)
    .where(eq(topTraderWeekPayouts.weekStartAt, window.weekStartAt))
    .limit(1);

  if (existing) {
    return {
      ok: true,
      status: "already_settled",
      weekLabel: existing.weekLabel,
      winnerUserId: existing.winnerUserId ?? undefined,
    };
  }

  const candidates = await loadWeekCandidates({
    weekStartAt: window.weekStartAt,
    weekEndAt: window.weekEndAt,
  });

  if (!candidates.length) {
    await db.insert(topTraderWeekPayouts).values({
      weekStartAt: window.weekStartAt,
      weekEndAt: window.weekEndAt,
      weekLabel: window.weekLabel,
      status: "no_winner",
      prizeUsdt: fmtTradeAmount(TOP_TRADER_PRIZE_USDT),
      meta: { reason: "no_competition_trades" },
    });
    return { ok: true, status: "no_winner", weekLabel: window.weekLabel };
  }

  const winner = pickWinner(candidates);
  if (!winner) {
    const top = candidates[0];
    await db.insert(topTraderWeekPayouts).values({
      weekStartAt: window.weekStartAt,
      weekEndAt: window.weekEndAt,
      weekLabel: window.weekLabel,
      winnerUserId: top?.userId ?? null,
      weeklyPnlUsdt: top ? fmtTradeAmount(top.weeklyPnl) : null,
      tradeCount: top?.tradeCount ?? 0,
      status: top && top.kycStatus !== "approved" ? "pending_kyc" : "no_winner",
      prizeUsdt: fmtTradeAmount(TOP_TRADER_PRIZE_USDT),
      meta: {
        reason:
          top && top.weeklyPnl <= 0
            ? "no_positive_pnl"
            : top && top.kycStatus !== "approved"
              ? "kyc_required"
              : "unknown",
      },
    });
    return {
      ok: true,
      status: top && top.kycStatus !== "approved" ? "pending_kyc" : "no_winner",
      weekLabel: window.weekLabel,
    };
  }

  const prizeStr = fmtTradeAmount(TOP_TRADER_PRIZE_USDT);
  const batchId = randomUUID();
  const paidAt = new Date();

  await db.transaction(async (tx) => {
    await creditUserAsset(tx, winner.userId, "USDT", prizeStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: winner.userId,
        entryType: "top_trader_week_prize",
        asset: "USDT",
        amount: prizeStr,
        meta: {
          weekLabel: window.weekLabel,
          weekStartAt: window.weekStartAt.toISOString(),
          weekEndAt: window.weekEndAt.toISOString(),
          weeklyPnlUsdt: winner.weeklyPnl,
          tradeCount: winner.tradeCount,
        },
      },
    ]);

    await tx.insert(topTraderWeekPayouts).values({
      weekStartAt: window.weekStartAt,
      weekEndAt: window.weekEndAt,
      weekLabel: window.weekLabel,
      winnerUserId: winner.userId,
      weeklyPnlUsdt: fmtTradeAmount(winner.weeklyPnl),
      tradeCount: winner.tradeCount,
      prizeUsdt: prizeStr,
      status: "paid",
      paidAt,
      ledgerBatchId: batchId,
    });
  });

  await createUserNotification({
    userId: winner.userId,
    kind: "top_trader_week_winner",
    payload: {
      weekLabel: window.weekLabel,
      prizeUsdt: TOP_TRADER_PRIZE_USDT,
      weeklyPnlUsdt: winner.weeklyPnl,
      tradeCount: winner.tradeCount,
      href: "/app/community/traders?tab=top_trader",
    },
  });

  return {
    ok: true,
    status: "paid",
    weekLabel: window.weekLabel,
    winnerUserId: winner.userId,
    prizeUsdt: TOP_TRADER_PRIZE_USDT,
  };
}

export async function getRecentTopTraderWinners(
  limit = 3,
): Promise<TopTraderWeekWinnerView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(topTraderWeekPayouts)
    .where(eq(topTraderWeekPayouts.status, "paid"))
    .orderBy(desc(topTraderWeekPayouts.weekStartAt))
    .limit(limit);

  if (!rows.length) return [];

  const userIds = rows
    .map((r) => r.winnerUserId)
    .filter((id): id is string => Boolean(id));

  const profileRows = userIds.length
    ? await db
        .select({
          userId: communityUserProfiles.userId,
          handle: communityUserProfiles.handle,
          displayName: communityUserProfiles.displayName,
          avatarUrl: users.avatarUrl,
          userDisplayName: users.displayName,
        })
        .from(communityUserProfiles)
        .innerJoin(users, eq(users.id, communityUserProfiles.userId))
        .where(inArray(communityUserProfiles.userId, userIds))
    : [];

  const profileMap = new Map(profileRows.map((p) => [p.userId, p]));

  return rows
    .filter((r) => r.winnerUserId)
    .map((r) => {
      const p = profileMap.get(r.winnerUserId!);
      return {
        weekLabel: r.weekLabel,
        weekStartAt: r.weekStartAt.toISOString(),
        weekEndAt: r.weekEndAt.toISOString(),
        userId: r.winnerUserId!,
        displayName: p?.displayName ?? p?.userDisplayName ?? "Trader",
        handle: p?.handle ?? null,
        avatarUrl: p?.avatarUrl ?? null,
        weeklyPnlUsdt: Number(r.weeklyPnlUsdt ?? 0),
        prizeUsdt: Number(r.prizeUsdt ?? TOP_TRADER_PRIZE_USDT),
        tradeCount: r.tradeCount,
        paidAt: r.paidAt?.toISOString() ?? null,
        status: r.status,
      };
    });
}

export async function getLastTopTraderWinner(): Promise<TopTraderWeekWinnerView | null> {
  const list = await getRecentTopTraderWinners(1);
  return list[0] ?? null;
}

export async function listAdminTopTraderPayouts(
  limit = 52,
): Promise<AdminTopTraderPayoutRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(topTraderWeekPayouts)
    .orderBy(desc(topTraderWeekPayouts.weekStartAt))
    .limit(limit);

  if (!rows.length) return [];

  const userIds = rows
    .map((r) => r.winnerUserId)
    .filter((id): id is string => Boolean(id));

  const profileRows = userIds.length
    ? await db
        .select({
          userId: communityUserProfiles.userId,
          handle: communityUserProfiles.handle,
          displayName: communityUserProfiles.displayName,
          userDisplayName: users.displayName,
        })
        .from(communityUserProfiles)
        .innerJoin(users, eq(users.id, communityUserProfiles.userId))
        .where(inArray(communityUserProfiles.userId, userIds))
    : [];

  const profileMap = new Map(profileRows.map((p) => [p.userId, p]));

  return rows.map((r) => {
    const p = r.winnerUserId ? profileMap.get(r.winnerUserId) : undefined;
    return {
      id: r.id,
      weekLabel: r.weekLabel,
      weekStartAt: r.weekStartAt.toISOString(),
      weekEndAt: r.weekEndAt.toISOString(),
      status: r.status,
      prizeUsdt: Number(r.prizeUsdt ?? TOP_TRADER_PRIZE_USDT),
      weeklyPnlUsdt: r.weeklyPnlUsdt != null ? Number(r.weeklyPnlUsdt) : null,
      tradeCount: r.tradeCount,
      paidAt: r.paidAt?.toISOString() ?? null,
      winnerUserId: r.winnerUserId,
      winnerDisplayName: p?.displayName ?? p?.userDisplayName ?? null,
      winnerHandle: p?.handle ?? null,
      meta: r.meta ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export async function listTopTraderWeekHistory(
  limit = 12,
): Promise<TopTraderWeekHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(topTraderWeekPayouts)
    .orderBy(desc(topTraderWeekPayouts.weekStartAt))
    .limit(limit);

  if (!rows.length) return [];

  const userIds = rows
    .map((r) => r.winnerUserId)
    .filter((id): id is string => Boolean(id));

  const profileRows = userIds.length
    ? await db
        .select({
          userId: communityUserProfiles.userId,
          handle: communityUserProfiles.handle,
          displayName: communityUserProfiles.displayName,
          avatarUrl: users.avatarUrl,
          userDisplayName: users.displayName,
        })
        .from(communityUserProfiles)
        .innerJoin(users, eq(users.id, communityUserProfiles.userId))
        .where(inArray(communityUserProfiles.userId, userIds))
    : [];

  const profileMap = new Map(profileRows.map((p) => [p.userId, p]));

  return rows.map((r) => {
    const p = r.winnerUserId ? profileMap.get(r.winnerUserId) : undefined;
    return {
      weekLabel: r.weekLabel,
      weekStartAt: r.weekStartAt.toISOString(),
      weekEndAt: r.weekEndAt.toISOString(),
      status: r.status,
      winnerUserId: r.winnerUserId,
      displayName: p?.displayName ?? p?.userDisplayName ?? null,
      handle: p?.handle ?? null,
      avatarUrl: p?.avatarUrl ?? null,
      weeklyPnlUsdt: r.weeklyPnlUsdt != null ? Number(r.weeklyPnlUsdt) : null,
      prizeUsdt: Number(r.prizeUsdt ?? TOP_TRADER_PRIZE_USDT),
      tradeCount: r.tradeCount,
    };
  });
}
