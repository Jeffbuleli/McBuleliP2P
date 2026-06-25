import { and, eq } from "drizzle-orm";
import { getDb, topTraderParticipants } from "@/db";
import {
  TOP_TRADER_DAILY_TRADES,
  getTopTraderProgramInfo,
} from "@/lib/community/top-trader-competition";

export type TopTraderParticipantStatus = {
  optedIn: boolean;
  weekStartAt: string;
  tradesOpenedToday: number;
  tradesRemainingToday: number;
  refillUsed: boolean;
  canTrade: boolean;
  programStatus: "active" | "ended" | "upcoming";
};

function gmtDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function getTopTraderParticipantRow(
  userId: string,
  weekStartAt: Date,
) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(topTraderParticipants)
    .where(
      and(
        eq(topTraderParticipants.userId, userId),
        eq(topTraderParticipants.weekStartAt, weekStartAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function isActiveTopTraderParticipant(userId: string): Promise<boolean> {
  const program = getTopTraderProgramInfo();
  if (program.status !== "active") return false;
  const row = await getTopTraderParticipantRow(
    userId,
    new Date(program.weekStartAt),
  );
  return row != null;
}

export async function getTopTraderParticipantStatus(
  userId: string,
): Promise<TopTraderParticipantStatus> {
  const program = getTopTraderProgramInfo();
  const weekStart = new Date(program.weekStartAt);

  if (program.status !== "active") {
    return {
      optedIn: false,
      weekStartAt: program.weekStartAt,
      tradesOpenedToday: 0,
      tradesRemainingToday: 0,
      refillUsed: false,
      canTrade: false,
      programStatus: program.status,
    };
  }

  const row = await getTopTraderParticipantRow(userId, weekStart);
  if (!row) {
    return {
      optedIn: false,
      weekStartAt: program.weekStartAt,
      tradesOpenedToday: 0,
      tradesRemainingToday: TOP_TRADER_DAILY_TRADES,
      refillUsed: false,
      canTrade: false,
      programStatus: program.status,
    };
  }

  const today = gmtDateString();
  const tradesToday =
    row.tradesTodayDate === today ? row.tradesOpenedToday : 0;
  const remaining = Math.max(0, TOP_TRADER_DAILY_TRADES - tradesToday);

  return {
    optedIn: true,
    weekStartAt: program.weekStartAt,
    tradesOpenedToday: tradesToday,
    tradesRemainingToday: remaining,
    refillUsed: row.refillUsed,
    canTrade: remaining > 0,
    programStatus: program.status,
  };
}

export async function optInTopTrader(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const program = getTopTraderProgramInfo();
  if (program.status === "upcoming") {
    return { ok: false, message: "top_trader_not_started" };
  }
  if (program.status === "ended") {
    return { ok: false, message: "top_trader_ended" };
  }

  const db = getDb();
  const weekStart = new Date(program.weekStartAt);
  const existing = await getTopTraderParticipantRow(userId, weekStart);
  if (existing) return { ok: true };

  await db.insert(topTraderParticipants).values({
    userId,
    weekStartAt: weekStart,
    tradesOpenedToday: 0,
    tradesTodayDate: null,
    refillUsed: false,
  });

  return { ok: true };
}

export async function assertCanOpenCompetitionTrade(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const program = getTopTraderProgramInfo();
  if (program.status !== "active") {
    return { ok: false, message: "top_trader_not_active" };
  }

  const status = await getTopTraderParticipantStatus(userId);
  if (!status.optedIn) {
    return { ok: false, message: "top_trader_opt_in_required" };
  }
  if (status.tradesRemainingToday <= 0) {
    return { ok: false, message: "top_trader_daily_limit" };
  }

  return { ok: true };
}

type DbTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export async function assertAndRecordCompetitionTradeInTx(
  tx: DbTx,
  userId: string,
  weekStartAt: Date,
): Promise<void> {
  const today = gmtDateString();
  const [row] = await tx
    .select()
    .from(topTraderParticipants)
    .where(
      and(
        eq(topTraderParticipants.userId, userId),
        eq(topTraderParticipants.weekStartAt, weekStartAt),
      ),
    )
    .limit(1);

  if (!row) throw new Error("top_trader_opt_in_required");

  const count = row.tradesTodayDate === today ? row.tradesOpenedToday : 0;
  if (count >= TOP_TRADER_DAILY_TRADES) {
    throw new Error("top_trader_daily_limit");
  }

  await tx
    .update(topTraderParticipants)
    .set({
      tradesOpenedToday: count + 1,
      tradesTodayDate: today,
    })
    .where(eq(topTraderParticipants.id, row.id));
}

export async function assertCompetitionDemoRefill(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const program = getTopTraderProgramInfo();
  if (program.status !== "active") return { ok: true };

  const row = await getTopTraderParticipantRow(
    userId,
    new Date(program.weekStartAt),
  );
  if (!row) return { ok: true };
  if (row.refillUsed) {
    return { ok: false, message: "top_trader_refill_used" };
  }
  return { ok: true };
}

export async function markCompetitionRefillUsed(
  tx: DbTx,
  userId: string,
  weekStartAt: Date,
): Promise<void> {
  await tx
    .update(topTraderParticipants)
    .set({ refillUsed: true })
    .where(
      and(
        eq(topTraderParticipants.userId, userId),
        eq(topTraderParticipants.weekStartAt, weekStartAt),
      ),
    );
}

/** Competition positions open today (GMT) for quota display. */
export async function countCompetitionOpensToday(userId: string): Promise<number> {
  const program = getTopTraderProgramInfo();
  const row = await getTopTraderParticipantRow(
    userId,
    new Date(program.weekStartAt),
  );
  if (!row) return 0;
  const today = gmtDateString();
  return row.tradesTodayDate === today ? row.tradesOpenedToday : 0;
}
