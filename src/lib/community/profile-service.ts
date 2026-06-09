import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import {
  communityBlogPosts,
  communityComments,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { listUserBadges } from "@/lib/community/badges-service";
import { grantCommunityProfileSetup } from "@/lib/community/rewards-service";
import { reputationLevelFromScore } from "@/lib/community/reputation-levels";
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

export type PublicProfileView = {
  userId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  showKycBadge: boolean;
  avatarUrl: string | null;
  reputationScore: number;
  reputationLevel: string;
  postsCount: number;
  blogCount: number;
  commentCount: number;
  memberSince: string;
  badges: { slug: string; labelFr: string; labelEn: string; iconKey: string }[];
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

export async function getPublicProfileByHandle(
  handle: string,
): Promise<PublicProfileView | null> {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, handle))
    .limit(1);
  if (!profile) return null;

  const [u] = await db
    .select({ avatarUrl: users.avatarUrl, kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, profile.userId))
    .limit(1);

  const [blogs] = await db
    .select({ n: count() })
    .from(communityBlogPosts)
    .where(
      and(
        eq(communityBlogPosts.authorId, profile.userId),
        eq(communityBlogPosts.status, "published"),
      ),
    );

  const [comments] = await db
    .select({ n: count() })
    .from(communityComments)
    .where(eq(communityComments.authorId, profile.userId));

  const badges = await listUserBadges(profile.userId);
  const resolvedHandle = await maybeRepairLegacyHandle(
    db,
    profile,
    profile.displayName,
  );
  const level = reputationLevelFromScore(profile.reputationScore);

  return {
    userId: profile.userId,
    handle: resolvedHandle,
    displayName: profile.displayName,
    bio: profile.bio,
    showKycBadge: profile.showKycBadge && u?.kycStatus === "approved",
    avatarUrl: u?.avatarUrl ?? null,
    reputationScore: profile.reputationScore,
    reputationLevel: level.id,
    postsCount: profile.postsCount,
    blogCount: Number(blogs?.n ?? 0),
    commentCount: Number(comments?.n ?? 0),
    memberSince: profile.createdAt.toISOString(),
    badges,
  };
}
