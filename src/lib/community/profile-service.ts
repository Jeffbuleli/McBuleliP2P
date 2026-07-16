import { and, count, desc, eq, gte, ilike, inArray, or, sql, sum } from "drizzle-orm";
import {
  communityComments,
  communityMedia,
  communityPosts,
  communityTradingSignals,
  communityUserProfiles,
  getDb,
  rewardPointGrants,
  users,
} from "@/db";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { listUserBadges } from "@/lib/community/badges-service";
import {
  getActiveBuildersMembership,
  getActiveBuildersTiersMap,
} from "@/lib/builders/builders-service";
import type { BuildersTier } from "@/lib/builders/builders-config";
import {
  getActiveAmbassadorMandate,
  getActiveAmbassadorUserIds,
} from "@/lib/community/ambassador-service";
import {
  countFollowing,
  countTraderFollowers,
  isFollowingTrader,
} from "@/lib/community/follows-service";
import { UserRole } from "@/lib/roles";
import { grantCommunityProfileSetup } from "@/lib/community/rewards-service";
import { reputationLevelFromScore } from "@/lib/community/reputation-levels";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import {
  candidateHandle,
  isLegacyGarbageHandle,
  isValidCommunityHandle,
  normalizeUsernameBase,
} from "@/lib/community/username";

function displayAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return normalizePublicMediaUrl(url) ?? url;
}

function displayMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return normalizePublicMediaUrl(url) ?? url;
}

async function allocateHandle(
  db: ReturnType<typeof getDb>,
  displayName: string,
): Promise<string> {
  const base = normalizeUsernameBase(displayName);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const handle = candidateHandle(base, attempt);
    const [taken] = await db
      .select({ userId: communityUserProfiles.userId })
      .from(communityUserProfiles)
      .where(eq(communityUserProfiles.handle, handle))
      .limit(1);
    if (!taken) return handle;
  }
  return `${base}_${Date.now().toString(36).slice(-4)}`;
}

async function maybeRepairLegacyHandle(
  db: ReturnType<typeof getDb>,
  profile: typeof communityUserProfiles.$inferSelect,
  displayName: string,
): Promise<string> {
  if (!isLegacyGarbageHandle(profile.handle, displayName)) {
    return profile.handle;
  }
  const next = await allocateHandle(db, displayName);
  await db
    .update(communityUserProfiles)
    .set({ handle: next, updatedAt: new Date() })
    .where(eq(communityUserProfiles.userId, profile.userId));
  return next;
}

export type CommunityAuthorView = {
  userId: string;
  handle: string;
  displayName: string;
  showKycBadge: boolean;
  avatarUrl: string | null;
  reputationScore?: number;
  reputationLevel?: string;
  memberSince?: string;
  builderTier?: BuildersTier | null;
  isAmbassador?: boolean;
};

export async function ensureCommunityProfile(
  userId: string,
): Promise<CommunityAuthorView> {
  await ensureCommunitySchema();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  if (existing) {
    const [u] = await db
      .select({ avatarUrl: users.avatarUrl, kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const handle = await maybeRepairLegacyHandle(
      db,
      existing,
      existing.displayName,
    );
    const level = reputationLevelFromScore(existing.reputationScore);
    return {
      userId,
      handle,
      displayName: existing.displayName,
      showKycBadge:
        existing.showKycBadge && u?.kycStatus === "approved",
      avatarUrl: displayAvatarUrl(u?.avatarUrl),
      reputationScore: existing.reputationScore,
      reputationLevel: level.id,
      memberSince: existing.createdAt.toISOString(),
    };
  }

  const [u] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const displayName =
    u?.displayName?.trim() ||
    u?.email?.split("@")[0]?.slice(0, 32) ||
    "Membre";

  const handle = await allocateHandle(db, displayName);
  await db.insert(communityUserProfiles).values({
    userId,
    handle,
    displayName: displayName.slice(0, 64),
    showKycBadge: u?.kycStatus === "approved",
  });

  await grantCommunityProfileSetup(userId);

  const [created] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  return {
    userId,
    handle: created?.handle ?? handle,
    displayName: created?.displayName ?? displayName,
    showKycBadge: u?.kycStatus === "approved",
    avatarUrl: displayAvatarUrl(u?.avatarUrl),
  };
}

export async function getAuthorsMap(
  userIds: string[],
): Promise<Map<string, CommunityAuthorView>> {
  await ensureCommunitySchema();
  const uniq = [...new Set(userIds)];
  const map = new Map<string, CommunityAuthorView>();
  if (!uniq.length) return map;

  const db = getDb();
  const profiles = await db
    .select()
    .from(communityUserProfiles)
    .where(inArray(communityUserProfiles.userId, uniq));

  const userRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(inArray(users.id, uniq));

  const userById = new Map(userRows.map((r) => [r.id, r]));

  let buildersByUser = new Map<string, BuildersTier>();
  let ambassadorIds = new Set<string>();
  try {
    buildersByUser = await getActiveBuildersTiersMap(uniq);
  } catch {
    /* table may be missing before migration 0098 */
  }
  try {
    ambassadorIds = await getActiveAmbassadorUserIds(uniq);
  } catch {
    /* table may be missing before migration 0104 */
  }

  for (const id of uniq) {
    const p = profiles.find((x) => x.userId === id);
    const u = userById.get(id);
    if (p) {
      const level = reputationLevelFromScore(p.reputationScore);
      map.set(id, {
        userId: id,
        handle: p.handle,
        displayName: p.displayName,
        showKycBadge: p.showKycBadge && u?.kycStatus === "approved",
        avatarUrl: displayAvatarUrl(u?.avatarUrl),
        reputationScore: p.reputationScore,
        reputationLevel: level.id,
        memberSince: p.createdAt.toISOString(),
        builderTier: buildersByUser.get(id) ?? null,
        isAmbassador: ambassadorIds.has(id),
      });
    } else if (u) {
      map.set(id, {
        userId: id,
        handle: normalizeUsernameBase(
          u.displayName?.trim() || u.email.split("@")[0] || "user",
        ),
        displayName:
          u.displayName?.trim() || u.email.split("@")[0] || "Membre",
        showKycBadge: u.kycStatus === "approved",
        avatarUrl: displayAvatarUrl(u.avatarUrl),
        builderTier: buildersByUser.get(id) ?? null,
        isAmbassador: ambassadorIds.has(id),
      });
    }
  }

  return map;
}

export type AuthorSignalStats = {
  openSignals: number;
  closedSignals: number;
  signalWinRate: number | null;
};

async function loadAuthorSignalStats(
  authorId: string,
): Promise<AuthorSignalStats> {
  const db = getDb();
  const rows = await db
    .select({
      status: communityTradingSignals.status,
      outcome: communityTradingSignals.outcome,
      n: count(),
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

/** Horizon A5 public creator metrics (never expose wallet BP balance). */
export type CreatorProfileStats = {
  bpEarned30d: number;
  posts: number;
  likesReceived: number;
  tags: { tag: string; count: number }[];
};

export type PublicProfileView = {
  userId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  showKycBadge: boolean;
  verifiedBlue: boolean;
  isAdmin: boolean;
  avatarUrl: string | null;
  coverUrl: string | null;
  reputationScore: number;
  reputationLevel: string;
  postsCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  memberSince: string;
  online: boolean;
  badges: { slug: string; labelFr: string; labelEn: string; iconKey: string }[];
  builderTier: BuildersTier | null;
  isAmbassador: boolean;
  viewerFollows: boolean;
  isOwnProfile: boolean;
  signalStats: AuthorSignalStats;
  stats: CreatorProfileStats;
};

async function loadCreatorProfileStats(
  authorId: string,
  postsCount: number,
): Promise<CreatorProfileStats> {
  const db = getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [bpRow] = await db
    .select({ total: sum(rewardPointGrants.points) })
    .from(rewardPointGrants)
    .where(
      and(
        eq(rewardPointGrants.userId, authorId),
        gte(rewardPointGrants.createdAt, since),
        sql`${rewardPointGrants.grantType} like 'community_%'`,
        sql`${rewardPointGrants.points} > 0`,
      ),
    );

  const [likesRow] = await db
    .select({ total: sum(communityPosts.likeCount) })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.authorId, authorId),
        eq(communityPosts.status, "published"),
      ),
    );

  const tagRows = await db
    .select({
      tag: communityPosts.utilityTag,
      n: count(),
    })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.authorId, authorId),
        eq(communityPosts.status, "published"),
      ),
    )
    .groupBy(communityPosts.utilityTag)
    .orderBy(desc(count()))
    .limit(5);

  return {
    bpEarned30d: Number(bpRow?.total ?? 0),
    posts: postsCount,
    likesReceived: Number(likesRow?.total ?? 0),
    tags: tagRows
      .filter((r) => r.tag)
      .map((r) => ({ tag: r.tag as string, count: Number(r.n) })),
  };
}

export async function searchCommunityHandles(
  query: string,
  limit = 8,
): Promise<{ handle: string; displayName: string }[]> {
  const term = query.trim().toLowerCase().replace(/^@/, "");
  if (term.length < 1) return [];

  const db = getDb();
  const rows = await db
    .select({
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
    })
    .from(communityUserProfiles)
    .where(
      or(
        ilike(communityUserProfiles.handle, `${term}%`),
        ilike(communityUserProfiles.displayName, `${term}%`),
      ),
    )
    .limit(Math.min(limit, 12));

  return rows;
}

const ONLINE_MS = 5 * 60 * 1000;

async function resolveCoverUrl(
  coverMediaId: string | null,
): Promise<string | null> {
  if (!coverMediaId) return null;
  const db = getDb();
  const [m] = await db
    .select({ publicUrl: communityMedia.publicUrl })
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.id, coverMediaId),
        eq(communityMedia.status, "ready"),
      ),
    )
    .limit(1);
  return displayMediaUrl(m?.publicUrl);
}

export async function getPublicProfileByHandle(
  handle: string,
  viewerId?: string | null,
): Promise<PublicProfileView | null> {
  await ensureCommunitySchema();
  const db = getDb();
  const [profile] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, handle))
    .limit(1);
  if (!profile) return null;

  const [u] = await db
    .select({
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, profile.userId))
    .limit(1);

  const [comments] = await db
    .select({ n: count() })
    .from(communityComments)
    .where(eq(communityComments.authorId, profile.userId));

  const [publishedPosts] = await db
    .select({ n: count() })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.authorId, profile.userId),
        eq(communityPosts.status, "published"),
      ),
    );
  const livePostsCount = Number(publishedPosts?.n ?? 0);

  const badges = await listUserBadges(profile.userId);
  let builders: Awaited<ReturnType<typeof getActiveBuildersMembership>> = null;
  try {
    builders = await getActiveBuildersMembership(profile.userId);
  } catch {
    /* migration 0098 */
  }
  let isAmbassador = false;
  try {
    isAmbassador = !!(await getActiveAmbassadorMandate(profile.userId));
  } catch {
    /* migration 0104 */
  }
  const resolvedHandle = await maybeRepairLegacyHandle(
    db,
    profile,
    profile.displayName,
  );
  const level = reputationLevelFromScore(profile.reputationScore);
  const subs = await listActiveBotSubscriptions(profile.userId);
  const followerCount = await countTraderFollowers(profile.userId);
  const followingCount = await countFollowing(profile.userId);
  const signalStats = await loadAuthorSignalStats(profile.userId);
  const coverUrl = await resolveCoverUrl(profile.coverMediaId);
  const online =
    !!profile.lastActiveAt &&
    Date.now() - profile.lastActiveAt.getTime() < ONLINE_MS;
  const postsCount = Math.max(profile.postsCount, livePostsCount);
  const stats = await loadCreatorProfileStats(profile.userId, postsCount);

  return {
    userId: profile.userId,
    handle: resolvedHandle,
    displayName: profile.displayName,
    bio: profile.bio,
    showKycBadge: profile.showKycBadge && u?.kycStatus === "approved",
    verifiedBlue: profile.verifiedBlue || subs.length > 0,
    isAdmin:
      u?.role === UserRole.AGENT || u?.role === UserRole.SUPER_ADMIN,
    avatarUrl: displayAvatarUrl(u?.avatarUrl),
    coverUrl,
    reputationScore: profile.reputationScore,
    reputationLevel: level.id,
    postsCount,
    commentCount: Number(comments?.n ?? 0),
    followerCount,
    followingCount,
    memberSince: profile.createdAt.toISOString(),
    online,
    badges,
    builderTier: builders?.tier ?? null,
    isAmbassador,
    viewerFollows: viewerId
      ? await isFollowingTrader(viewerId, profile.userId)
      : false,
    isOwnProfile: viewerId === profile.userId,
    signalStats,
    stats,
  };
}

export type OwnCommunityProfile = {
  handle: string;
  bio: string;
  showKycBadge: boolean;
  displayName: string;
};

export async function getOwnCommunityProfile(
  userId: string,
): Promise<OwnCommunityProfile | null> {
  const author = await ensureCommunityProfile(userId);
  const db = getDb();
  const [row] = await db
    .select({
      bio: communityUserProfiles.bio,
      showKycBadge: communityUserProfiles.showKycBadge,
      displayName: communityUserProfiles.displayName,
    })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);
  if (!row) return null;
  return {
    handle: author.handle,
    bio: row.bio?.trim() ?? "",
    showKycBadge: row.showKycBadge,
    displayName: row.displayName,
  };
}

export async function updateOwnCommunityProfile(
  userId: string,
  patch: { handle?: string; bio?: string; showKycBadge?: boolean },
): Promise<{ ok: true; profile: OwnCommunityProfile } | { ok: false; error: string }> {
  await ensureCommunityProfile(userId);
  const db = getDb();

  const updates: {
    handle?: string;
    bio?: string | null;
    showKycBadge?: boolean;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (patch.handle !== undefined) {
    const next = patch.handle.trim().toLowerCase();
    if (!isValidCommunityHandle(next)) {
      return { ok: false, error: "profile_community_handle_invalid" };
    }
    const [taken] = await db
      .select({ userId: communityUserProfiles.userId })
      .from(communityUserProfiles)
      .where(eq(communityUserProfiles.handle, next))
      .limit(1);
    if (taken && taken.userId !== userId) {
      return { ok: false, error: "profile_community_handle_taken" };
    }
    updates.handle = next;
  }

  if (patch.bio !== undefined) {
    const bio = patch.bio.trim();
    updates.bio = bio ? bio.slice(0, 280) : null;
  }

  if (patch.showKycBadge !== undefined) {
    updates.showKycBadge = patch.showKycBadge;
  }

  if (Object.keys(updates).length <= 1) {
    return { ok: false, error: "profile_invalid_input" };
  }

  await db
    .update(communityUserProfiles)
    .set(updates)
    .where(eq(communityUserProfiles.userId, userId));

  const profile = await getOwnCommunityProfile(userId);
  if (!profile) return { ok: false, error: "profile_invalid_input" };
  return { ok: true, profile };
}
