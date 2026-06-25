import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  communityUserProfiles,
  getDb,
  tradeFuturesPositions,
  users,
} from "@/db";
import { isFollowingTrader } from "@/lib/community/follows-service";

export type {
  TopTraderCompetitionTrade,
  TopTraderDailyLeader,
  TopTraderFeedTrade,
  TopTraderLeaderboardEntry,
  TopTraderProgramInfo,
  TopTraderProgramStatus,
} from "@/lib/community/top-trader-types";
import type {
  TopTraderCompetitionTrade,
  TopTraderDailyLeader,
  TopTraderFeedTrade,
  TopTraderLeaderboardEntry,
  TopTraderProgramInfo,
  TopTraderProgramStatus,
} from "@/lib/community/top-trader-types";

/** Program ends last Sunday of July 2026, 00:59 GMT. */
export const PROGRAM_END = new Date("2026-07-26T00:59:59.000Z");
export const PROGRAM_START = new Date("2026-06-23T00:00:00.000Z");
export const TOP_TRADER_PRIZE_USDT = 10;
export const TOP_TRADER_DEMO_BALANCE = 10_000;
export const TOP_TRADER_DAILY_TRADES = 5;
export const TOP_TRADER_MAX_POSITION_HOURS = 24;

function startOfWeekGmt(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
}

function endOfWeekGmt(weekStart: Date): Date {
  const x = new Date(weekStart);
  x.setUTCDate(x.getUTCDate() + 6);
  x.setUTCHours(0, 59, 59, 999);
  return x;
}

/** Week window to settle (after Sunday 00:59 GMT). */
export function getCompletedWeekForPayout(now = new Date()): {
  weekStartAt: Date;
  weekEndAt: Date;
  weekLabel: string;
} | null {
  const info = getTopTraderProgramInfo(now);
  const weekEnd = new Date(info.weekEndAt);
  const weekStart = new Date(info.weekStartAt);

  if (now.getTime() > weekEnd.getTime() + 15_000) {
    if (weekStart.getTime() <= PROGRAM_END.getTime()) {
      return {
        weekStartAt: weekStart,
        weekEndAt: weekEnd,
        weekLabel: info.weekLabel,
      };
    }
  }

  const prevStart = new Date(weekStart);
  prevStart.setUTCDate(prevStart.getUTCDate() - 7);
  const prevEnd = endOfWeekGmt(prevStart);
  if (prevEnd.getTime() < PROGRAM_START.getTime()) return null;
  if (prevStart.getTime() > PROGRAM_END.getTime()) return null;

  const weekNum =
    Math.floor(
      (prevStart.getTime() - PROGRAM_START.getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1;

  return {
    weekStartAt: prevStart,
    weekEndAt: prevEnd,
    weekLabel: `S${weekNum}`,
  };
}

export function getTopTraderProgramInfo(now = new Date()): TopTraderProgramInfo {
  const status: TopTraderProgramStatus =
    now < PROGRAM_START ? "upcoming" : now > PROGRAM_END ? "ended" : "active";

  let weekStart = startOfWeekGmt(now);
  if (weekStart < PROGRAM_START) weekStart = new Date(PROGRAM_START);

  let weekEnd = endOfWeekGmt(weekStart);
  if (weekEnd > PROGRAM_END) weekEnd = new Date(PROGRAM_END);

  const weekNum = Math.floor(
    (weekStart.getTime() - PROGRAM_START.getTime()) / (7 * 24 * 60 * 60 * 1000),
  ) + 1;

  return {
    status,
    prizeUsdt: TOP_TRADER_PRIZE_USDT,
    programStartAt: PROGRAM_START.toISOString(),
    programEndAt: PROGRAM_END.toISOString(),
    weekStartAt: weekStart.toISOString(),
    weekEndAt: weekEnd.toISOString(),
    weekLabel: `S${weekNum}`,
    msUntilWeekEnd: Math.max(0, weekEnd.getTime() - now.getTime()),
    msUntilProgramEnd: Math.max(0, PROGRAM_END.getTime() - now.getTime()),
    demoBalance: TOP_TRADER_DEMO_BALANCE,
    dailyTrades: TOP_TRADER_DAILY_TRADES,
    maxPositionHours: TOP_TRADER_MAX_POSITION_HOURS,
  };
}

export async function getTopTraderLeaderboard(args: {
  viewerId: string | null;
  limit?: number;
}): Promise<{
  program: TopTraderProgramInfo;
  traders: TopTraderLeaderboardEntry[];
  viewer: { rank: number; weeklyPnlUsdt: number; tradeCount: number } | null;
}> {
  const program = getTopTraderProgramInfo();
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);

  if (program.status === "upcoming") {
    return { program, traders: [], viewer: null };
  }

  const weekStart = new Date(program.weekStartAt);
  const weekEnd = new Date(program.weekEndAt);

  const pnlRows = await db
    .select({
      userId: tradeFuturesPositions.userId,
      weeklyPnl: sql<string>`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`,
      tradeCount: sql<number>`count(*)::int`,
      winCount: sql<number>`sum(case when ${tradeFuturesPositions.realizedPnlUsdt}::numeric > 0 then 1 else 0 end)::int`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.isDemo, true),
        eq(tradeFuturesPositions.isCompetition, true),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, weekStart),
        lte(tradeFuturesPositions.closedAt, weekEnd),
      ),
    )
    .groupBy(tradeFuturesPositions.userId)
    .orderBy(
      desc(sql`coalesce(sum(${tradeFuturesPositions.realizedPnlUsdt}::numeric), 0)`),
      sql`count(*)::int asc`,
    );

  if (!pnlRows.length) return { program, traders: [], viewer: null };

  const viewerRow = args.viewerId
    ? pnlRows.find((r) => r.userId === args.viewerId)
    : undefined;
  const viewer = viewerRow
    ? {
        rank: pnlRows.findIndex((r) => r.userId === args.viewerId) + 1,
        weeklyPnlUsdt: Number(viewerRow.weeklyPnl),
        tradeCount: Number(viewerRow.tradeCount),
      }
    : null;

  const pageRows = pnlRows.slice(0, limit);
  const userIds = pageRows.map((r) => r.userId);

  const profileRows = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      showKycBadge: communityUserProfiles.showKycBadge,
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
      showKycBadge: boolean;
      avatarUrl: string | null;
      kycStatus: string | null;
      userDisplayName: string | null;
    }
  >(profileRows.map((p) => [p.userId, { ...p, handle: p.handle }]));

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
        showKycBadge: false,
        avatarUrl: u.avatarUrl,
        kycStatus: u.kycStatus,
        userDisplayName: u.displayName,
      });
    }
  }

  const traders: TopTraderLeaderboardEntry[] = [];
  let rank = 0;
  for (const row of pageRows) {
    rank += 1;
    const p = profileMap.get(row.userId);
    const weeklyPnl = Number(row.weeklyPnl);
    const tradeCount = Number(row.tradeCount);
    const winCount = Number(row.winCount);
    const following = await isFollowingTrader(args.viewerId, row.userId);

    traders.push({
      rank,
      userId: row.userId,
      handle: p?.handle ?? null,
      displayName: p?.displayName ?? p?.userDisplayName ?? "Trader",
      avatarUrl: p?.avatarUrl ?? null,
      showKycBadge: Boolean(p?.showKycBadge && p?.kycStatus === "approved"),
      weeklyPnlUsdt: weeklyPnl,
      tradeCount,
      winCount,
      winRatePct: tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : null,
      isFollowing: following,
    });
  }

  return { program, traders, viewer };
}

export async function getTopTraderWeekTrades(args: {
  userId: string;
  limit?: number;
}): Promise<TopTraderCompetitionTrade[]> {
  const program = getTopTraderProgramInfo();
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
  const weekStart = new Date(program.weekStartAt);
  const weekEnd = new Date(program.weekEndAt);

  const rows = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.userId, args.userId),
        eq(tradeFuturesPositions.isDemo, true),
        eq(tradeFuturesPositions.isCompetition, true),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, weekStart),
        lte(tradeFuturesPositions.closedAt, weekEnd),
      ),
    )
    .orderBy(desc(tradeFuturesPositions.closedAt))
    .limit(limit);

  return rows
    .map((r) => mapCompetitionTradeRow(r))
    .filter((t): t is TopTraderCompetitionTrade => Boolean(t));
}

function mapCompetitionTradeRow(r: {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  leverage: number;
  marginUsdt: string;
  entryPrice: string;
  closePrice: string | null;
  stopLossPrice: string | null;
  takeProfitPrice: string | null;
  realizedPnlUsdt: string | null;
  feeOpenUsdt: string;
  feeCloseUsdt: string | null;
  closeReason: string | null;
  openedAt: Date;
  closedAt: Date | null;
}): TopTraderCompetitionTrade | null {
  if (!r.closedAt || !r.closePrice || r.realizedPnlUsdt == null) return null;
  const margin = Number(r.marginUsdt);
  const pnl = Number(r.realizedPnlUsdt);
  const opened = r.openedAt.getTime();
  const closed = r.closedAt.getTime();
  return {
    id: r.id,
    userId: r.userId,
    symbol: r.symbol,
    side: r.side,
    leverage: r.leverage,
    marginUsdt: margin,
    entryPrice: Number(r.entryPrice),
    closePrice: Number(r.closePrice),
    stopLossPrice: r.stopLossPrice ? Number(r.stopLossPrice) : null,
    takeProfitPrice: r.takeProfitPrice ? Number(r.takeProfitPrice) : null,
    realizedPnlUsdt: pnl,
    feeOpenUsdt: Number(r.feeOpenUsdt),
    feeCloseUsdt: Number(r.feeCloseUsdt ?? 0),
    roePct: margin > 0 ? (pnl / margin) * 100 : 0,
    closeReason: r.closeReason,
    openedAt: r.openedAt.toISOString(),
    closedAt: r.closedAt.toISOString(),
    durationMin: Math.max(0, Math.round((closed - opened) / 60_000)),
  };
}

export async function getTopTraderWeekFeedTrades(args?: {
  limit?: number;
}): Promise<TopTraderFeedTrade[]> {
  const program = getTopTraderProgramInfo();
  const db = getDb();
  const limit = Math.min(Math.max(args?.limit ?? 40, 1), 80);
  const weekStart = new Date(program.weekStartAt);
  const weekEnd = new Date(program.weekEndAt);

  const rows = await db
    .select({
      id: tradeFuturesPositions.id,
      userId: tradeFuturesPositions.userId,
      symbol: tradeFuturesPositions.symbol,
      side: tradeFuturesPositions.side,
      leverage: tradeFuturesPositions.leverage,
      marginUsdt: tradeFuturesPositions.marginUsdt,
      entryPrice: tradeFuturesPositions.entryPrice,
      closePrice: tradeFuturesPositions.closePrice,
      stopLossPrice: tradeFuturesPositions.stopLossPrice,
      takeProfitPrice: tradeFuturesPositions.takeProfitPrice,
      realizedPnlUsdt: tradeFuturesPositions.realizedPnlUsdt,
      feeOpenUsdt: tradeFuturesPositions.feeOpenUsdt,
      feeCloseUsdt: tradeFuturesPositions.feeCloseUsdt,
      closeReason: tradeFuturesPositions.closeReason,
      openedAt: tradeFuturesPositions.openedAt,
      closedAt: tradeFuturesPositions.closedAt,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      showKycBadge: communityUserProfiles.showKycBadge,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      userDisplayName: users.displayName,
    })
    .from(tradeFuturesPositions)
    .leftJoin(
      communityUserProfiles,
      eq(communityUserProfiles.userId, tradeFuturesPositions.userId),
    )
    .leftJoin(users, eq(users.id, tradeFuturesPositions.userId))
    .where(
      and(
        eq(tradeFuturesPositions.isDemo, true),
        eq(tradeFuturesPositions.isCompetition, true),
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, weekStart),
        lte(tradeFuturesPositions.closedAt, weekEnd),
      ),
    )
    .orderBy(desc(tradeFuturesPositions.closedAt))
    .limit(limit);

  return rows
    .map((r) => {
      const base = mapCompetitionTradeRow(r);
      if (!base) return null;
      return {
        ...base,
        displayName: r.displayName ?? r.userDisplayName ?? "Trader",
        handle: r.handle ?? null,
        avatarUrl: r.avatarUrl ?? null,
        showKycBadge: Boolean(r.showKycBadge && r.kycStatus === "approved"),
      } satisfies TopTraderFeedTrade;
    })
    .filter((t): t is TopTraderFeedTrade => Boolean(t));
}

export async function resolveUserIdByHandle(handle: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, handle))
    .limit(1);
  return row?.userId ?? null;
}
