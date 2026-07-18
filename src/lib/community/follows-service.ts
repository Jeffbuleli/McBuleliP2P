import { and, count, desc, eq, inArray, lt } from "drizzle-orm";
import {
  communityTraderFollows,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { notifyCommunityTraderFollow } from "@/lib/community/community-notifications";
import {
  addCommunityReputationOnce,
} from "@/lib/community/reputation-service";
import { grantCommunityTraderFollow } from "@/lib/community/rewards-service";
import { normalizePublicMediaUrl } from "@/lib/media-url";

export type FollowDiscoverReason =
  | "mutual"
  | "engaged"
  | "taste"
  | "circle"
  | "nearby"
  | "active"
  | "rising";

export type FollowGraphPerson = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  reputationScore: number;
  showKycBadge: boolean;
  verifiedBlue: boolean;
  isFollowing: boolean;
  followsYou: boolean;
  isSelf: boolean;
  reason: FollowDiscoverReason | null;
};

function listAvatarUrl(
  userId: string,
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  // Keep JSON small: proxy data URLs instead of embedding megabyte base64 blobs.
  if (url.startsWith("data:image/")) {
    return `/api/community/avatars/${userId}`;
  }
  if (url.startsWith("data:") || url.startsWith("blob:")) return null;
  return normalizePublicMediaUrl(url) ?? url;
}

async function resolveHandleUserId(handle: string): Promise<string | null> {
  const normalized = handle.trim().replace(/^@+/, "").toLowerCase();
  if (!normalized) return null;
  const db = getDb();
  const [row] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, normalized))
    .limit(1);
  return row?.userId ?? null;
}

export async function enrichFollowGraphPeopleForDiscover(
  rows: Array<{
    userId: string;
    handle: string;
    displayName: string;
    reputationScore: number;
    showKycBadge: boolean;
    verifiedBlue: boolean;
    avatarUrl: string | null;
    kycStatus: string | null;
  }>,
  viewerId: string | null,
  reasonByUserId?: Map<string, FollowDiscoverReason>,
): Promise<FollowGraphPerson[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.userId);
  const followingSet = new Set<string>();
  const followsYouSet = new Set<string>();

  if (viewerId) {
    const db = getDb();
    const [outEdges, inEdges] = await Promise.all([
      db
        .select({ traderId: communityTraderFollows.traderId })
        .from(communityTraderFollows)
        .where(
          and(
            eq(communityTraderFollows.followerId, viewerId),
            inArray(communityTraderFollows.traderId, ids),
          ),
        ),
      db
        .select({ followerId: communityTraderFollows.followerId })
        .from(communityTraderFollows)
        .where(
          and(
            eq(communityTraderFollows.traderId, viewerId),
            inArray(communityTraderFollows.followerId, ids),
          ),
        ),
    ]);
    for (const e of outEdges) followingSet.add(e.traderId);
    for (const e of inEdges) followsYouSet.add(e.followerId);
  }

  return rows.map((r) => {
    const isFollowing = followingSet.has(r.userId);
    const followsYou = followsYouSet.has(r.userId);
    const isSelf = !!viewerId && r.userId === viewerId;
    let reason = reasonByUserId?.get(r.userId) ?? null;
    if (!reason && isFollowing && followsYou) reason = "mutual";
    return {
      userId: r.userId,
      handle: r.handle,
      displayName: r.displayName,
      avatarUrl: listAvatarUrl(r.userId, r.avatarUrl),
      reputationScore: r.reputationScore,
      showKycBadge: r.showKycBadge && r.kycStatus === "approved",
      verifiedBlue: r.verifiedBlue,
      isFollowing,
      followsYou,
      isSelf,
      reason,
    };
  });
}

export async function followTrader(args: {
  followerId: string;
  traderHandle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const traderHandle = args.traderHandle.trim().replace(/^@+/, "").toLowerCase();
  const [trader] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, traderHandle))
    .limit(1);

  if (!trader) return { ok: false, error: "not_found" };
  if (trader.userId === args.followerId) return { ok: false, error: "self_follow" };

  try {
    await db.insert(communityTraderFollows).values({
      followerId: args.followerId,
      traderId: trader.userId,
    });
  } catch {
    // Already following - never re-grant BP / reputation / notify.
    return { ok: true };
  }

  // BP: once per (follower, trader) forever via idempotency key - unfollow cannot re-farm.
  await grantCommunityTraderFollow({
    followerId: args.followerId,
    traderId: trader.userId,
  });
  // Reputation: once per follower pair - no clawback on unfollow (same anti-farm rule).
  const rep = await addCommunityReputationOnce({
    userId: trader.userId,
    delta: 3,
    reason: "trader_followed",
    refType: "follow",
    refId: args.followerId,
  });
  if (rep.applied) {
    await notifyCommunityTraderFollow({
      traderId: trader.userId,
      followerId: args.followerId,
    });
  }

  return { ok: true };
}

export async function unfollowTrader(args: {
  followerId: string;
  traderHandle: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const traderHandle = args.traderHandle.trim().replace(/^@+/, "").toLowerCase();
  const [trader] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, traderHandle))
    .limit(1);

  if (!trader) return { ok: false, error: "not_found" };

  await db
    .delete(communityTraderFollows)
    .where(
      and(
        eq(communityTraderFollows.followerId, args.followerId),
        eq(communityTraderFollows.traderId, trader.userId),
      ),
    );

  return { ok: true };
}

export async function isFollowingTrader(
  followerId: string | null,
  traderId: string,
): Promise<boolean> {
  if (!followerId) return false;
  const db = getDb();
  const [row] = await db
    .select({ id: communityTraderFollows.id })
    .from(communityTraderFollows)
    .where(
      and(
        eq(communityTraderFollows.followerId, followerId),
        eq(communityTraderFollows.traderId, traderId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function countTraderFollowers(traderId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.traderId, traderId));
  return Number(row?.n ?? 0);
}

export async function countFollowing(followerId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.followerId, followerId));
  return Number(row?.n ?? 0);
}

export async function listFollowersOf(args: {
  handle: string;
  viewerId: string | null;
  limit?: number;
  cursor?: string | null;
}): Promise<{ people: FollowGraphPerson[]; nextCursor: string | null }> {
  const subjectId = await resolveHandleUserId(args.handle);
  if (!subjectId) return { people: [], nextCursor: null };

  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 40, 1), 80);
  const cursorDate = args.cursor ? new Date(args.cursor) : null;

  const rows = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      reputationScore: communityUserProfiles.reputationScore,
      showKycBadge: communityUserProfiles.showKycBadge,
      verifiedBlue: communityUserProfiles.verifiedBlue,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      followedAt: communityTraderFollows.createdAt,
    })
    .from(communityTraderFollows)
    .innerJoin(
      communityUserProfiles,
      eq(communityUserProfiles.userId, communityTraderFollows.followerId),
    )
    .innerJoin(users, eq(users.id, communityTraderFollows.followerId))
    .where(
      and(
        eq(communityTraderFollows.traderId, subjectId),
        cursorDate && !Number.isNaN(cursorDate.getTime())
          ? lt(communityTraderFollows.createdAt, cursorDate)
          : undefined,
      ),
    )
    .orderBy(desc(communityTraderFollows.createdAt))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const people = await enrichFollowGraphPeopleForDiscover(slice, args.viewerId);
  const nextCursor =
    rows.length > limit
      ? slice[slice.length - 1]?.followedAt?.toISOString() ?? null
      : null;
  return { people, nextCursor };
}

export async function listFollowingOf(args: {
  handle: string;
  viewerId: string | null;
  limit?: number;
  cursor?: string | null;
}): Promise<{ people: FollowGraphPerson[]; nextCursor: string | null }> {
  const subjectId = await resolveHandleUserId(args.handle);
  if (!subjectId) return { people: [], nextCursor: null };

  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 40, 1), 80);
  const cursorDate = args.cursor ? new Date(args.cursor) : null;

  const rows = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      reputationScore: communityUserProfiles.reputationScore,
      showKycBadge: communityUserProfiles.showKycBadge,
      verifiedBlue: communityUserProfiles.verifiedBlue,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      followedAt: communityTraderFollows.createdAt,
    })
    .from(communityTraderFollows)
    .innerJoin(
      communityUserProfiles,
      eq(communityUserProfiles.userId, communityTraderFollows.traderId),
    )
    .innerJoin(users, eq(users.id, communityTraderFollows.traderId))
    .where(
      and(
        eq(communityTraderFollows.followerId, subjectId),
        cursorDate && !Number.isNaN(cursorDate.getTime())
          ? lt(communityTraderFollows.createdAt, cursorDate)
          : undefined,
      ),
    )
    .orderBy(desc(communityTraderFollows.createdAt))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const people = await enrichFollowGraphPeopleForDiscover(slice, args.viewerId);
  const nextCursor =
    rows.length > limit
      ? slice[slice.length - 1]?.followedAt?.toISOString() ?? null
      : null;
  return { people, nextCursor };
}

