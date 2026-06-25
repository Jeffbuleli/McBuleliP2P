/** Shared Top Trader types — safe for client `import type` (no DB). */

export type TopTraderProgramStatus = "active" | "ended" | "upcoming";

export type TopTraderProgramInfo = {
  status: TopTraderProgramStatus;
  prizeUsdt: number;
  programStartAt: string;
  programEndAt: string;
  weekStartAt: string;
  weekEndAt: string;
  weekLabel: string;
  msUntilWeekEnd: number;
  msUntilProgramEnd: number;
  demoBalance: number;
  dailyTrades: number;
  maxPositionHours: number;
};

export type TopTraderLeaderboardEntry = {
  rank: number;
  userId: string;
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  showKycBadge: boolean;
  weeklyPnlUsdt: number;
  tradeCount: number;
  winCount: number;
  winRatePct: number | null;
  isFollowing: boolean;
};

export type TopTraderCompetitionTrade = {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  leverage: number;
  marginUsdt: number;
  entryPrice: number;
  closePrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  realizedPnlUsdt: number;
  feeOpenUsdt: number;
  feeCloseUsdt: number;
  roePct: number;
  closeReason: string | null;
  openedAt: string;
  closedAt: string;
  durationMin: number;
};

export type TopTraderWeekWinnerView = {
  weekLabel: string;
  weekStartAt: string;
  weekEndAt: string;
  userId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  weeklyPnlUsdt: number;
  prizeUsdt: number;
  tradeCount: number;
  paidAt: string | null;
  status: string;
};

export type AdminTopTraderPayoutRow = {
  id: string;
  weekLabel: string;
  weekStartAt: string;
  weekEndAt: string;
  status: string;
  prizeUsdt: number;
  weeklyPnlUsdt: number | null;
  tradeCount: number;
  paidAt: string | null;
  winnerUserId: string | null;
  winnerDisplayName: string | null;
  winnerHandle: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};
