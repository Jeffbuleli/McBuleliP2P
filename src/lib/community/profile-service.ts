import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import {
  communityComments,
  communityMedia,
  communityPosts,
  communityTradingSignals,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { listUserBadges } from "@/lib/community/badges-service";
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
  normalizeUsernameBase,
} from "@/lib/community/username";

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
      avatarUrl: u?.avatarUrl ?? null,
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
    avatarUrl: u?.avatarUrl ?? null,
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
        avatarUrl: u?.avatarUrl ?? null,
        reputationScore: p.reputationScore,
        reputationLevel: level.id,
        memberSince: p.createdAt.toISOString(),
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
        avatarUrl: u.avatarUrl ?? null,
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
  viewerFollows: boolean;
  isOwnProfile: boolean;
  signalStats: AuthorSignalStats;
};

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
  return m?.publicUrl ?? null;
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

  return {
    userId: profile.userId,
    handle: resolvedHandle,
    displayName: profile.displayName,
    bio: profile.bio,
    showKycBadge: profile.showKycBadge && u?.kycStatus === "approved",
    verifiedBlue: profile.verifiedBlue || subs.length > 0,
    isAdmin:
      u?.role === UserRole.AGENT || u?.role === UserRole.SUPER_ADMIN,
    avatarUrl: u?.avatarUrl ?? null,
    coverUrl,
    reputationScore: profile.reputationScore,
    reputationLevel: level.id,
    postsCount: Math.max(profile.postsCount, livePostsCount),
    commentCount: Number(comments?.n ?? 0),
    followerCount,
    followingCount,
    memberSince: profile.createdAt.toISOString(),
    online,
    badges,
    viewerFollows: viewerId
      ? await isFollowingTrader(viewerId, profile.userId)
      : false,
    isOwnProfile: viewerId === profile.userId,
    signalStats,
  };
}
