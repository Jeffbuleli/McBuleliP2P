import { and, count, desc, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import {
  communityComments,
  communityLikes,
  communityPosts,
  communityTraderFollows,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import {
  type FollowDiscoverReason,
  type FollowGraphPerson,
  enrichFollowGraphPeopleForDiscover,
} from "@/lib/community/follows-service";

type CandidateRow = {
  userId: string;
  handle: string;
  displayName: string;
  reputationScore: number;
  showKycBadge: boolean;
  verifiedBlue: boolean;
  lastActiveAt: Date | null;
  avatarUrl: string | null;
  kycStatus: string | null;
  countryCode: string | null;
};

function daySeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/** Light shuffle with a daily seed so waves vary without being random each request. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

async function loadProfilesByIds(
  userIds: string[],
): Promise<Map<string, CandidateRow>> {
  if (userIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      reputationScore: communityUserProfiles.reputationScore,
      showKycBadge: communityUserProfiles.showKycBadge,
      verifiedBlue: communityUserProfiles.verifiedBlue,
      lastActiveAt: communityUserProfiles.lastActiveAt,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      countryCode: users.countryCode,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId))
    .where(inArray(communityUserProfiles.userId, userIds));

  return new Map(rows.map((r) => [r.userId, r]));
}

/**
 * Varied discovery: follow-backs, engagement, shared tastes with followed people,
 * friends-of-friends, nearby, then active fillers.
 */
export async function suggestPeopleToFollow(args: {
  viewerId: string;
  limit?: number;
  excludeUserIds?: string[];
}): Promise<FollowGraphPerson[]> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 12, 1), 24);
  const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const ONLINE_MS = 15 * 60 * 1000;
  const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [viewer] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, args.viewerId))
    .limit(1);

  const followingRows = await db
    .select({ traderId: communityTraderFollows.traderId })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.followerId, args.viewerId));
  const followingIds = followingRows.map((r) => r.traderId);

  const exclude = new Set(followingIds);
  exclude.add(args.viewerId);
  for (const id of args.excludeUserIds ?? []) {
    if (id) exclude.add(id);
  }
  const excludeIds = [...exclude];
  const country = viewer?.countryCode?.trim().toUpperCase() || null;

  // --- Affinity: authors of posts the viewer liked ---
  const likedAuthors = await db
    .select({
      authorId: communityPosts.authorId,
      n: count(),
    })
    .from(communityLikes)
    .innerJoin(
      communityPosts,
      and(
        eq(communityPosts.id, communityLikes.targetId),
        eq(communityLikes.targetType, "post"),
      ),
    )
    .where(
      and(
        eq(communityLikes.userId, args.viewerId),
        gte(communityLikes.createdAt, since),
        ne(communityPosts.authorId, args.viewerId),
        excludeIds.length
          ? notInArray(communityPosts.authorId, excludeIds)
          : undefined,
      ),
    )
    .groupBy(communityPosts.authorId)
    .orderBy(desc(count()))
    .limit(24);

  // --- Affinity: authors of posts the viewer commented on ---
  const commentedAuthors = await db
    .select({
      authorId: communityPosts.authorId,
      n: count(),
    })
    .from(communityComments)
    .innerJoin(communityPosts, eq(communityPosts.id, communityComments.postId))
    .where(
      and(
        eq(communityComments.authorId, args.viewerId),
        gte(communityComments.createdAt, since),
        ne(communityPosts.authorId, args.viewerId),
        excludeIds.length
          ? notInArray(communityPosts.authorId, excludeIds)
          : undefined,
      ),
    )
    .groupBy(communityPosts.authorId)
    .orderBy(desc(count()))
    .limit(24);

  const engagedScore = new Map<string, number>();
  for (const r of likedAuthors) {
    engagedScore.set(r.authorId, (engagedScore.get(r.authorId) ?? 0) + Number(r.n) * 3);
  }
  for (const r of commentedAuthors) {
    engagedScore.set(r.authorId, (engagedScore.get(r.authorId) ?? 0) + Number(r.n) * 4);
  }

  // --- Taste: utility tags from liked posts + posts by people you follow ---
  const likedTags = await db
    .select({
      tag: communityPosts.utilityTag,
      n: count(),
    })
    .from(communityLikes)
    .innerJoin(
      communityPosts,
      and(
        eq(communityPosts.id, communityLikes.targetId),
        eq(communityLikes.targetType, "post"),
      ),
    )
    .where(
      and(
        eq(communityLikes.userId, args.viewerId),
        gte(communityLikes.createdAt, since),
      ),
    )
    .groupBy(communityPosts.utilityTag)
    .orderBy(desc(count()))
    .limit(6);

  let followTags: { tag: string; n: number }[] = [];
  if (followingIds.length > 0) {
    followTags = (
      await db
        .select({
          tag: communityPosts.utilityTag,
          n: count(),
        })
        .from(communityPosts)
        .where(
          and(
            inArray(communityPosts.authorId, followingIds.slice(0, 40)),
            eq(communityPosts.status, "published"),
            gte(communityPosts.publishedAt, since),
          ),
        )
        .groupBy(communityPosts.utilityTag)
        .orderBy(desc(count()))
        .limit(6)
    ).map((r) => ({ tag: r.tag, n: Number(r.n) }));
  }

  const tagWeight = new Map<string, number>();
  for (const t of likedTags) {
    tagWeight.set(t.tag, (tagWeight.get(t.tag) ?? 0) + Number(t.n) * 2);
  }
  for (const t of followTags) {
    tagWeight.set(t.tag, (tagWeight.get(t.tag) ?? 0) + t.n);
  }
  const topTags = [...tagWeight.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  let tasteAuthors: { authorId: string; n: number }[] = [];
  if (topTags.length > 0) {
    tasteAuthors = (
      await db
        .select({
          authorId: communityPosts.authorId,
          n: count(),
        })
        .from(communityPosts)
        .where(
          and(
            inArray(communityPosts.utilityTag, topTags),
            eq(communityPosts.status, "published"),
            gte(communityPosts.publishedAt, since),
            ne(communityPosts.authorId, args.viewerId),
            excludeIds.length
              ? notInArray(communityPosts.authorId, excludeIds)
              : undefined,
          ),
        )
        .groupBy(communityPosts.authorId)
        .orderBy(desc(count()))
        .limit(30)
    ).map((r) => ({ authorId: r.authorId, n: Number(r.n) }));
  }

  // --- Circle: friends of friends ---
  let circleAuthors: { userId: string; n: number }[] = [];
  if (followingIds.length > 0) {
    circleAuthors = (
      await db
        .select({
          userId: communityTraderFollows.traderId,
          n: count(),
        })
        .from(communityTraderFollows)
        .where(
          and(
            inArray(communityTraderFollows.followerId, followingIds.slice(0, 50)),
            excludeIds.length
              ? notInArray(communityTraderFollows.traderId, excludeIds)
              : undefined,
          ),
        )
        .groupBy(communityTraderFollows.traderId)
        .orderBy(desc(count()))
        .limit(24)
    ).map((r) => ({ userId: r.userId, n: Number(r.n) }));
  }

  // --- Mutuals (follow back) ---
  const mutualRows = await db
    .select({
      userId: communityTraderFollows.followerId,
    })
    .from(communityTraderFollows)
    .where(
      and(
        eq(communityTraderFollows.traderId, args.viewerId),
        excludeIds.length
          ? notInArray(communityTraderFollows.followerId, excludeIds)
          : undefined,
      ),
    )
    .orderBy(desc(communityTraderFollows.createdAt))
    .limit(12);

  // --- Nearby / active pool ---
  const generalPool = await db
    .select({
      userId: communityUserProfiles.userId,
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      reputationScore: communityUserProfiles.reputationScore,
      showKycBadge: communityUserProfiles.showKycBadge,
      verifiedBlue: communityUserProfiles.verifiedBlue,
      lastActiveAt: communityUserProfiles.lastActiveAt,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      countryCode: users.countryCode,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId))
    .where(
      and(
        ne(communityUserProfiles.userId, args.viewerId),
        excludeIds.length
          ? notInArray(communityUserProfiles.userId, excludeIds)
          : undefined,
        sql`${communityUserProfiles.postsCount} > 0`,
      ),
    )
    .orderBy(
      desc(communityUserProfiles.reputationScore),
      desc(communityUserProfiles.lastActiveAt),
    )
    .limit(40);

  const needIds = new Set<string>();
  for (const id of mutualRows.map((r) => r.userId)) needIds.add(id);
  for (const id of engagedScore.keys()) needIds.add(id);
  for (const r of tasteAuthors) needIds.add(r.authorId);
  for (const r of circleAuthors) needIds.add(r.userId);

  const profileMap = await loadProfilesByIds([...needIds]);
  for (const row of generalPool) profileMap.set(row.userId, row);

  const reasonByUserId = new Map<string, FollowDiscoverReason>();
  const scoreByUserId = new Map<string, number>();

  const bump = (userId: string, reason: FollowDiscoverReason, score: number) => {
    if (!profileMap.has(userId) || exclude.has(userId)) return;
    const prev = scoreByUserId.get(userId) ?? 0;
    scoreByUserId.set(userId, prev + score);
    const rank: Record<FollowDiscoverReason, number> = {
      mutual: 6,
      engaged: 5,
      taste: 4,
      circle: 3,
      nearby: 2,
      active: 1,
      rising: 0,
    };
    const cur = reasonByUserId.get(userId);
    if (!cur || rank[reason] > rank[cur]) reasonByUserId.set(userId, reason);
  };

  for (const r of mutualRows) bump(r.userId, "mutual", 100);
  for (const [id, s] of engagedScore) bump(id, "engaged", 50 + s);
  for (const r of tasteAuthors) bump(r.authorId, "taste", 30 + r.n);
  for (const r of circleAuthors) bump(r.userId, "circle", 20 + r.n * 2);

  for (const row of generalPool) {
    const sameCountry =
      !!country && (row.countryCode?.trim().toUpperCase() ?? "") === country;
    const recentlyActive =
      !!row.lastActiveAt && row.lastActiveAt.getTime() >= activeSince.getTime();
    const onlineNow =
      !!row.lastActiveAt &&
      Date.now() - row.lastActiveAt.getTime() < ONLINE_MS;
    if (sameCountry) bump(row.userId, "nearby", 15);
    else if (onlineNow || recentlyActive) bump(row.userId, "active", 8);
    else bump(row.userId, "rising", 3);
  }

  const rankedIds = [...scoreByUserId.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  // Variety: take top band, shuffle lightly, then fill buckets so one type doesn't dominate.
  const shuffledTop = seededShuffle(rankedIds.slice(0, Math.max(limit * 3, 18)), daySeed());
  const buckets: Record<FollowDiscoverReason, string[]> = {
    mutual: [],
    engaged: [],
    taste: [],
    circle: [],
    nearby: [],
    active: [],
    rising: [],
  };
  for (const id of shuffledTop) {
    const reason = reasonByUserId.get(id) ?? "rising";
    buckets[reason].push(id);
  }

  const caps: Partial<Record<FollowDiscoverReason, number>> = {
    mutual: 3,
    engaged: 3,
    taste: 3,
    circle: 2,
    nearby: 2,
    active: 2,
    rising: 2,
  };
  const picked: string[] = [];
  const pickSeen = new Set<string>();
  const take = (reason: FollowDiscoverReason, n: number) => {
    for (const id of buckets[reason]) {
      if (picked.length >= limit) return;
      if (pickSeen.has(id)) continue;
      if (n-- <= 0) break;
      pickSeen.add(id);
      picked.push(id);
    }
  };

  take("mutual", caps.mutual ?? 3);
  take("engaged", caps.engaged ?? 3);
  take("taste", caps.taste ?? 3);
  take("circle", caps.circle ?? 2);
  take("nearby", caps.nearby ?? 2);
  take("active", caps.active ?? 2);
  take("rising", caps.rising ?? 2);

  // Fill remaining from shuffled pool
  for (const id of shuffledTop) {
    if (picked.length >= limit) break;
    if (pickSeen.has(id)) continue;
    pickSeen.add(id);
    picked.push(id);
  }

  const rows = picked
    .map((id) => profileMap.get(id))
    .filter((r): r is CandidateRow => !!r);

  return enrichFollowGraphPeopleForDiscover(rows, args.viewerId, reasonByUserId);
}
