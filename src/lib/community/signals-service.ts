import { and, count, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import {
  communityTradingSignals,
  getDb,
} from "@/db";
import {
  getAuthorsMap,
  type CommunityAuthorView,
} from "@/lib/community/profile-service";
import { addCommunityReputation } from "@/lib/community/reputation-service";
import {
  grantCommunitySignalClosed,
  grantCommunitySignalPublish,
} from "@/lib/community/rewards-service";

export type TradingSignalView = {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: string | null;
  targetPrice: string | null;
  stopPrice: string | null;
  note: string;
  status: "open" | "closed" | "cancelled";
  outcome: "win" | "loss" | "neutral" | null;
  isEducational: boolean;
  publishedAt: string;
  closedAt: string | null;
  author: CommunityAuthorView;
};

function mapSignal(
  row: typeof communityTradingSignals.$inferSelect,
  author: CommunityAuthorView,
): TradingSignalView {
  return {
    id: row.id,
    symbol: row.symbol,
    side: row.side as "long" | "short",
    entryPrice: row.entryPrice,
    targetPrice: row.targetPrice,
    stopPrice: row.stopPrice,
    note: row.note,
    status: row.status as TradingSignalView["status"],
    outcome: (row.outcome as TradingSignalView["outcome"]) ?? null,
    isEducational: row.isEducational,
    publishedAt: row.publishedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    author,
  };
}

export async function listTradingSignals(args: {
  cursor?: string | null;
  limit?: number;
  authorId?: string;
  status?: "open" | "closed" | "all";
}): Promise<{ signals: TradingSignalView[]; nextCursor: string | null }> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);

  const conditions = [];
  if (args.authorId) {
    conditions.push(eq(communityTradingSignals.authorId, args.authorId));
  }
  if (args.status && args.status !== "all") {
    conditions.push(eq(communityTradingSignals.status, args.status));
  }
  if (args.cursor) {
    conditions.push(lt(communityTradingSignals.publishedAt, new Date(args.cursor)));
  }

  const rows = await db
    .select()
    .from(communityTradingSignals)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(communityTradingSignals.publishedAt))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const authorIds = [...new Set(slice.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  const signals = slice.map((r) =>
    mapSignal(r, authors.get(r.authorId)!),
  );

  const nextCursor =
    rows.length > limit
      ? slice[slice.length - 1]!.publishedAt.toISOString()
      : null;

  return { signals, nextCursor };
}

export async function searchTradingSignals(args: {
  q: string;
  limit?: number;
}): Promise<TradingSignalView[]> {
  const term = args.q.trim();
  if (term.length < 2) return [];
  const db = getDb();
  const limit = Math.min(args.limit ?? 6, 12);
  const rows = await db
    .select()
    .from(communityTradingSignals)
    .where(
      or(
        ilike(communityTradingSignals.symbol, `%${term.toUpperCase()}%`),
        ilike(communityTradingSignals.note, `%${term}%`),
      ),
    )
    .orderBy(desc(communityTradingSignals.publishedAt))
    .limit(limit);
  if (!rows.length) return [];
  const authors = await getAuthorsMap(rows.map((r) => r.authorId));
  return rows
    .map((r) => {
      const author = authors.get(r.authorId);
      return author ? mapSignal(r, author) : null;
    })
    .filter((s): s is TradingSignalView => s !== null);
}

export type AuthorSignalStats = {
  openSignals: number;
  closedSignals: number;
  signalWinRate: number | null;
};

export async function getAuthorSignalStats(
  authorId: string,
): Promise<AuthorSignalStats> {
  const db = getDb();
  const rows = await db
    .select({
      status: communityTradingSignals.status,
      outcome: communityTradingSignals.outcome,
      n: sql<number>`count(*)::int`,
    })
    .from(communityTradingSignals)
    .where(eq(communityTradingSignals.authorId, authorId))
    .groupBy(communityTradingSignals.status, communityTradingSignals.outcome);

  let openSignals = 0;
  let closedSignals = 0;
  let wins = 0;
  for (const r of rows) {
    const n = Number(r.n);
    if (r.status === "open") openSignals += n;
    if (r.status === "closed") {
      closedSignals += n;
      if (r.outcome === "win") wins += n;
    }
  }
  return {
    openSignals,
    closedSignals,
    signalWinRate:
      closedSignals > 0 ? Math.round((wins / closedSignals) * 100) : null,
  };
}

export async function createTradingSignal(args: {
  authorId: string;
  symbol: string;
  side: "long" | "short";
  entryPrice?: string | null;
  targetPrice?: string | null;
  stopPrice?: string | null;
  note: string;
}): Promise<
  | { ok: true; signal: TradingSignalView; bpGranted: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  const db = getDb();

  const [openCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(communityTradingSignals)
    .where(
      and(
        eq(communityTradingSignals.authorId, args.authorId),
        eq(communityTradingSignals.status, "open"),
      ),
    );
  if ((openCount?.n ?? 0) >= 5) {
    return { ok: false, error: "too_many_open" };
  }

  const [row] = await db
    .insert(communityTradingSignals)
    .values({
      authorId: args.authorId,
      symbol: args.symbol.toUpperCase().slice(0, 16),
      side: args.side,
      entryPrice: args.entryPrice ?? null,
      targetPrice: args.targetPrice ?? null,
      stopPrice: args.stopPrice ?? null,
      note: args.note.trim().slice(0, 500),
      isEducational: true,
    })
    .returning();

  const authors = await getAuthorsMap([args.authorId]);
  const bpGranted = await grantCommunitySignalPublish({
    userId: args.authorId,
    signalId: row!.id,
  });
  await addCommunityReputation({
    userId: args.authorId,
    delta: 5,
    reason: "signal_publish",
    refType: "signal",
    refId: row!.id,
  });

  return {
    ok: true,
    signal: mapSignal(row!, authors.get(args.authorId)!),
    bpGranted: { granted: bpGranted.granted, points: bpGranted.points },
  };
}

export async function closeTradingSignal(args: {
  signalId: string;
  authorId: string;
  outcome: "win" | "loss" | "neutral";
}): Promise<
  | { ok: true; signal: TradingSignalView; bpGranted: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(communityTradingSignals)
    .where(eq(communityTradingSignals.id, args.signalId))
    .limit(1);

  if (!existing) return { ok: false, error: "not_found" };
  if (existing.authorId !== args.authorId) return { ok: false, error: "forbidden" };
  if (existing.status !== "open") return { ok: false, error: "not_open" };

  const [row] = await db
    .update(communityTradingSignals)
    .set({
      status: "closed",
      outcome: args.outcome,
      closedAt: new Date(),
    })
    .where(eq(communityTradingSignals.id, args.signalId))
    .returning();

  const authors = await getAuthorsMap([args.authorId]);
  const bpGranted = await grantCommunitySignalClosed({
    userId: args.authorId,
    signalId: args.signalId,
    outcome: args.outcome,
  });
  await addCommunityReputation({
    userId: args.authorId,
    delta: args.outcome === "win" ? 15 : 2,
    reason: args.outcome === "win" ? "signal_win" : "signal_loss",
    refType: "signal",
    refId: args.signalId,
  });

  return {
    ok: true,
    signal: mapSignal(row!, authors.get(args.authorId)!),
    bpGranted: { granted: bpGranted.granted, points: bpGranted.points },
  };
}
