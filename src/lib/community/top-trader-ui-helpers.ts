import type {
  TopTraderCompetitionTrade,
  TopTraderDailyLeader,
  TopTraderFeedTrade,
  TopTraderProgramInfo,
} from "@/lib/community/top-trader-types";

const WEEKDAY_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function gmtDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function weekdayFromDayKey(dayKey: string): number {
  return new Date(`${dayKey}T12:00:00.000Z`).getUTCDay();
}

export function weekdayLabel(dayKey: string, fr: boolean): string {
  const d = weekdayFromDayKey(dayKey);
  return fr ? WEEKDAY_FR[d]! : WEEKDAY_EN[d]!;
}

export function formatGmtDayHeading(dayKey: string, fr: boolean): string {
  const wd = weekdayLabel(dayKey, fr);
  const [y, m, d] = dayKey.split("-");
  return fr ? `${wd} ${d}/${m}` : `${wd} ${m}/${d}`;
}

export function weekDayKeys(program: TopTraderProgramInfo): string[] {
  const keys: string[] = [];
  const start = new Date(program.weekStartAt);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export type TopTraderDayGroup = {
  dayKey: string;
  weekdayLabel: string;
  heading: string;
  trades: TopTraderFeedTrade[];
  dayPnlTotal: number;
};

export function groupFeedTradesByDay(
  trades: TopTraderFeedTrade[],
  program: TopTraderProgramInfo,
  fr: boolean,
): TopTraderDayGroup[] {
  const byDay = new Map<string, TopTraderFeedTrade[]>();
  for (const t of trades) {
    const key = gmtDayKey(t.closedAt);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }

  const keys = weekDayKeys(program);
  const groups: TopTraderDayGroup[] = [];

  for (const dayKey of [...keys].reverse()) {
    const dayTrades = (byDay.get(dayKey) ?? []).sort(
      (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
    );
    if (!dayTrades.length) continue;
    groups.push({
      dayKey,
      weekdayLabel: weekdayLabel(dayKey, fr),
      heading: formatGmtDayHeading(dayKey, fr),
      trades: dayTrades,
      dayPnlTotal: dayTrades.reduce((s, t) => s + t.realizedPnlUsdt, 0),
    });
  }

  return groups;
}

export function capTopTraderDayGroups<T extends { trades: unknown[] }>(
  groups: T[],
  opts?: { maxDays?: number; maxTradesPerDay?: number },
): T[] {
  const maxDays = opts?.maxDays ?? 3;
  const maxTradesPerDay = opts?.maxTradesPerDay ?? 8;
  return groups.slice(0, maxDays).map((g) => ({
    ...g,
    trades: g.trades.slice(0, maxTradesPerDay),
  }));
}

export function groupUserTradesByDay(
  trades: TopTraderCompetitionTrade[],
  fr: boolean,
): { dayKey: string; heading: string; trades: TopTraderCompetitionTrade[] }[] {
  const byDay = new Map<string, TopTraderCompetitionTrade[]>();
  for (const t of trades) {
    const key = gmtDayKey(t.closedAt);
    const list = byDay.get(key) ?? [];
    list.push(t);
    byDay.set(key, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayTrades]) => ({
      dayKey,
      heading: formatGmtDayHeading(dayKey, fr),
      trades: dayTrades.sort(
        (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime(),
      ),
    }));
}

export function closeReasonLabel(r: string | null, fr: boolean): string {
  if (r === "stop_loss") return fr ? "Stop loss" : "Stop loss";
  if (r === "take_profit") return fr ? "Take profit" : "Take profit";
  if (r === "liquidated") return fr ? "Liquidation" : "Liquidated";
  if (r === "manual") return fr ? "Clôture manuelle" : "Manual close";
  if (r === "tt_max_age") return fr ? "Limite 24h" : "24h limit";
  return r ?? "—";
}

export function closeReasonTone(r: string | null): "gain" | "loss" | "neutral" {
  if (r === "take_profit") return "gain";
  if (r === "stop_loss" || r === "liquidated") return "loss";
  return "neutral";
}

export function fmtTradePrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toFixed(2);
}

export function fmtTradeDt(iso: string, fr: boolean): string {
  return new Date(iso).toLocaleString(fr ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function fmtTradeTime(iso: string, fr: boolean): string {
  return new Date(iso).toLocaleTimeString(fr ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function fmtDurationMin(min: number, fr: boolean): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function pnlToneClass(n: number): string {
  return n >= 0 ? "text-[#305f33]" : "text-[#b45309]";
}

export function pnlBgClass(n: number): string {
  return n >= 0
    ? "border-[#bce4c9] bg-[#f0faf4]"
    : "border-[#fcd9b6] bg-[#fff7ed]";
}

export function sideClass(side: string): string {
  return side === "long" ? "text-[#305f33]" : "text-[#b45309]";
}

export function notionalUsdt(margin: number, leverage: number): number {
  return margin * leverage;
}

export function buildDailyLeadersFromFeed(
  trades: TopTraderFeedTrade[],
  program: TopTraderProgramInfo,
  fr: boolean,
): TopTraderDailyLeader[] {
  const weekKeys = weekDayKeys(program);
  const byDayUser = new Map<string, Map<string, { pnl: number; count: number; trade: TopTraderFeedTrade }>>();

  for (const t of trades) {
    const dayKey = gmtDayKey(t.closedAt);
    if (!weekKeys.includes(dayKey)) continue;
    const users = byDayUser.get(dayKey) ?? new Map();
    const prev = users.get(t.userId);
    users.set(t.userId, {
      pnl: (prev?.pnl ?? 0) + t.realizedPnlUsdt,
      count: (prev?.count ?? 0) + 1,
      trade: t,
    });
    byDayUser.set(dayKey, users);
  }

  return weekKeys.map((dayKey) => {
    const users = byDayUser.get(dayKey);
    if (!users || users.size === 0) {
      return {
        dayKey,
        weekday: weekdayFromDayKey(dayKey),
        weekdayLabel: weekdayLabel(dayKey, fr),
        userId: null,
        displayName: null,
        handle: null,
        avatarUrl: null,
        dailyPnlUsdt: 0,
        tradeCount: 0,
      };
    }
    let best: { userId: string; pnl: number; count: number; trade: TopTraderFeedTrade } | null =
      null;
    for (const [userId, v] of users) {
      if (!best || v.pnl > best.pnl) best = { userId, ...v };
    }
    const t = best!.trade;
    return {
      dayKey,
      weekday: weekdayFromDayKey(dayKey),
      weekdayLabel: weekdayLabel(dayKey, fr),
      userId: best!.userId,
      displayName: t.displayName,
      handle: t.handle,
      avatarUrl: t.avatarUrl,
      dailyPnlUsdt: best!.pnl,
      tradeCount: best!.count,
    };
  });
}
