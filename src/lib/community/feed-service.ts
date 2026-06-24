import { and, asc, desc, eq, gt, gte, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import {
  academyTrainingEvents,
  communityComments,
  communityLikes,
  communityPostViews,
  communityPosts,
  communityReports,
  communityTraderFollows,
  communityUserBlocks,
  communityUserProfiles,
  getDb,
} from "@/db";
import { communityEnabled, COMMUNITY_FEED_PAGE_SIZE } from "@/lib/community/config";
import {
  notifyCommunityComment,
  notifyCommunityLike,
} from "@/lib/community/community-notifications";
import { getPostMediaViews } from "@/lib/community/media-engagement-service";
import type { MediaItemView } from "@/lib/community/media-engagement-service";
import {
  ensureCommunityProfile,
  getAuthorsMap,
  type CommunityAuthorView,
} from "@/lib/community/profile-service";
import { ensureCommunitySchema } from "@/lib/community/community-schema";

async function ensureFeedReady(): Promise<void> {
  await ensureCommunitySchema();
}

const TRENDING_WINDOW_MS = 48 * 60 * 60 * 1000;

function trendingScoreSql() {
  return sql`(
    (${communityPosts.likeCount} * 2 + ${communityPosts.commentCount} * 3 + ${communityPosts.shareCount} * 5 + ${communityPosts.viewCount})::double precision
    / power(
      greatest(
        extract(epoch from (now() - coalesce(${communityPosts.publishedAt}, ${communityPosts.createdAt}))) / 3600.0,
        1.0
      ),
      1.5
    )
  )`;
}

function computeTrendingScore(row: {
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  viewCount: number | null;
  publishedAt: Date | null;
  createdAt: Date;
}): number {
  const published = row.publishedAt ?? row.createdAt;
  const hours = Math.max((Date.now() - published.getTime()) / 3_600_000, 1);
  const engagement =
    (row.likeCount ?? 0) * 2 +
    (row.commentCount ?? 0) * 3 +
    (row.shareCount ?? 0) * 5 +
    (row.viewCount ?? 0);
  return engagement / Math.pow(hours, 1.5);
}

const FOR_YOU_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function computeForYouScore(args: {
  row: (typeof communityPosts.$inferSelect);
  authorRep: number;
  isFollowed: boolean;
  isViewed: boolean;
}): number {
  const trending = computeTrendingScore(args.row);
  return (
    (args.isFollowed ? 48 : 0) +
    (args.isViewed ? -32 : 0) +
    trending * 0.85 +
    Math.min(args.authorRep / 4, 28) +
    ((args.row.mediaIds?.length ?? 0) > 0 ? 6 : 0)
  );
}
import {
  type FeedComposerKind,
  isFeedComposerKind,
  minBodyLengthForKind,
} from "@/lib/community/composer-config";
import {
  parseFormationPostMeta,
  type FormationPostMeta,
} from "@/lib/community/formation-post-meta";
import { moderateCommunityText } from "@/lib/community/moderation-service";
import {
  grantCommunityComment,
  grantCommunityLike,
  grantCommunityPostPublished,
  grantCommunityShare,
} from "@/lib/community/rewards-service";

const POST_COOLDOWN_MS = 30_000;

export type PublicPostShareView = {
  id: string;
  body: string;
  authorHandle: string;
  authorDisplayName: string;
  imageUrl: string | null;
  publishedAt: string;
};

export type FeedPostView = {
  id: string;
  body: string;
  postType: string;
  contentKind: string;
  formationMeta?: FormationPostMeta | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  publishedAt: string;
  author: CommunityAuthorView;
  media: MediaItemView[];
  status?: string;
  likedByMe: boolean;
  bpEarned?: number;
};

function resolveFormationMeta(row: {
  contentKind: string | null;
  meta: unknown;
  body: string;
}): FormationPostMeta | null {
  if (row.contentKind === "formation" || row.body.includes("Annonce · Formation")) {
    return parseFormationPostMeta(row.meta, row.body);
  }
  return null;
}

function rowToFeedPost(
  r: {
    id: string;
    body: string;
    postType: string;
    contentKind: string | null;
    meta: unknown;
    status: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    authorId: string;
    mediaIds: string[] | null;
  },
  author: CommunityAuthorView,
  media: MediaItemView[],
  likedByMe: boolean,
): FeedPostView {
  return {
    id: r.id,
    body: r.body,
    postType: r.postType,
    contentKind: r.contentKind ?? "news",
    formationMeta: resolveFormationMeta(r),
    status: r.status,
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    shareCount: r.shareCount,
    viewCount: r.viewCount ?? 0,
    publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
    author,
    media,
    likedByMe,
  };
}

async function blockedUserIds(viewerId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select({ blockedId: communityUserBlocks.blockedId })
    .from(communityUserBlocks)
    .where(eq(communityUserBlocks.blockerId, viewerId));
  return new Set(rows.map((r) => r.blockedId));
}

async function assertNotBlocked(
  viewerId: string,
  authorId: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: communityUserBlocks.id })
    .from(communityUserBlocks)
    .where(
      and(
        eq(communityUserBlocks.blockerId, viewerId),
        eq(communityUserBlocks.blockedId, authorId),
      ),
    )
    .limit(1);
  return !row;
}

async function listForYouFeedPosts(args: {
  viewerId: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<{ posts: FeedPostView[]; nextCursor: string | null }> {
  await ensureFeedReady();
  const limit = Math.min(args.limit ?? COMMUNITY_FEED_PAGE_SIZE, 40);
  const db = getDb();
  const viewerId = args.viewerId!;
  const blocked = await blockedUserIds(viewerId);

  let cursorScore: number | null = null;
  let cursorId: string | null = null;
  if (args.cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(args.cursor, "base64url").toString("utf8"),
      ) as { s?: number; id: string };
      if (typeof parsed.s === "number") cursorScore = parsed.s;
      cursorId = parsed.id;
    } catch {
      cursorScore = null;
      cursorId = null;
    }
  }

  const since = new Date(Date.now() - FOR_YOU_WINDOW_MS);
  const rows = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.status, "published"),
        gte(
          sql`coalesce(${communityPosts.publishedAt}, ${communityPosts.createdAt})`,
          since,
        ),
      ),
    )
    .orderBy(desc(communityPosts.publishedAt))
    .limit(120);

  const follows = await db
    .select({ traderId: communityTraderFollows.traderId })
    .from(communityTraderFollows)
    .where(eq(communityTraderFollows.followerId, viewerId));
  const followedSet = new Set(follows.map((f) => f.traderId));

  const viewedRows = await db
    .select({ postId: communityPostViews.postId })
    .from(communityPostViews)
    .where(eq(communityPostViews.viewerId, viewerId));
  const viewedSet = new Set(viewedRows.map((v) => v.postId));

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  const scored = rows
    .filter((r) => !blocked.has(r.authorId) && authors.has(r.authorId))
    .map((r) => {
      const author = authors.get(r.authorId)!;
      const score = computeForYouScore({
        row: r,
        authorRep: author.reputationScore ?? 0,
        isFollowed: followedSet.has(r.authorId),
        isViewed: viewedSet.has(r.id),
      });
      return { row: r, score, author };
    })
    .sort((a, b) => {
      const ds = b.score - a.score;
      if (ds !== 0) return ds;
      return b.row.id.localeCompare(a.row.id);
    });

  const filtered =
    cursorScore !== null && cursorId
      ? scored.filter(
          (item) =>
            item.score < cursorScore! ||
            (item.score === cursorScore && item.row.id < cursorId!),
        )
      : scored;

  const page = filtered.slice(0, limit);
  const postIds = page.map((p) => p.row.id);
  let likedSet = new Set<string>();
  if (postIds.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, viewerId),
          eq(communityLikes.targetType, "post"),
          inArray(communityLikes.targetId, postIds),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  const posts: FeedPostView[] = [];
  for (const { row, author } of page) {
    const media = await getPostMediaViews(row.id, row.mediaIds, viewerId);
    posts.push(rowToFeedPost(row, author, media, likedSet.has(row.id)));
  }

  let nextCursor: string | null = null;
  if (filtered.length > limit) {
    const last = page[page.length - 1];
    if (last) {
      nextCursor = Buffer.from(
        JSON.stringify({ s: last.score, id: last.row.id }),
        "utf8",
      ).toString("base64url");
    }
  }

  return { posts, nextCursor };
}

export async function listFeedPosts(args: {
  viewerId: string | null;
  cursor?: string | null;
  limit?: number;
  sort?: "recent" | "popular" | "trending" | "following" | "for_you";
}): Promise<{ posts: FeedPostView[]; nextCursor: string | null }> {
  if (!communityEnabled()) return { posts: [], nextCursor: null };
  await ensureFeedReady();

  if (args.sort === "for_you") {
    if (!args.viewerId) {
      return listFeedPosts({ ...args, sort: "trending" });
    }
    return listForYouFeedPosts(args);
  }

  const limit = Math.min(args.limit ?? COMMUNITY_FEED_PAGE_SIZE, 40);
  const db = getDb();
  const blocked = args.viewerId
    ? await blockedUserIds(args.viewerId)
    : new Set<string>();

  let cursorDate: Date | null = null;
  let cursorId: string | null = null;
  let cursorScore: number | null = null;
  if (args.cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(args.cursor, "base64url").toString("utf8"),
      ) as { t?: string; s?: number; id: string };
      cursorId = parsed.id;
      if (args.sort === "trending" && typeof parsed.s === "number") {
        cursorScore = parsed.s;
      } else if (parsed.t) {
        cursorDate = new Date(parsed.t);
      }
    } catch {
      cursorDate = null;
      cursorId = null;
      cursorScore = null;
    }
  }

  const conditions = [eq(communityPosts.status, "published")];

  if (args.sort === "trending") {
    conditions.push(
      gte(
        sql`coalesce(${communityPosts.publishedAt}, ${communityPosts.createdAt})`,
        new Date(Date.now() - TRENDING_WINDOW_MS),
      ),
    );
  }

  if (args.sort === "following") {
    if (!args.viewerId) return { posts: [], nextCursor: null };
    const follows = await db
      .select({ traderId: communityTraderFollows.traderId })
      .from(communityTraderFollows)
      .where(eq(communityTraderFollows.followerId, args.viewerId));
    const authorIds = follows.map((f) => f.traderId);
    if (!authorIds.length) return { posts: [], nextCursor: null };
    conditions.push(inArray(communityPosts.authorId, authorIds));
  }

  if (args.sort === "trending" && cursorScore !== null && cursorId) {
    const score = trendingScoreSql();
    conditions.push(
      or(
        sql`${score} < ${cursorScore}`,
        and(sql`${score} = ${cursorScore}`, lt(communityPosts.id, cursorId)),
      )!,
    );
  } else if (cursorDate && cursorId) {
    conditions.push(
      or(
        lt(communityPosts.publishedAt, cursorDate),
        and(
          eq(communityPosts.publishedAt, cursorDate),
          lt(communityPosts.id, cursorId),
        ),
      )!,
    );
  }

  const orderBy =
    args.sort === "trending"
      ? [desc(trendingScoreSql()), desc(communityPosts.id)]
      : args.sort === "popular"
        ? [
            desc(
              sql`(${communityPosts.likeCount} + ${communityPosts.commentCount})`,
            ),
            desc(communityPosts.publishedAt),
          ]
        : [desc(communityPosts.publishedAt), desc(communityPosts.id)];

  const rows = await db
    .select()
    .from(communityPosts)
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const authorIds = slice
    .map((r) => r.authorId)
    .filter((id) => !blocked.has(id));
  const authors = await getAuthorsMap(authorIds);

  const postIds = slice.map((r) => r.id);
  let likedSet = new Set<string>();
  if (args.viewerId && postIds.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, args.viewerId),
          eq(communityLikes.targetType, "post"),
          inArray(communityLikes.targetId, postIds),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  const posts: FeedPostView[] = [];
  for (const r of slice) {
    if (blocked.has(r.authorId)) continue;
    const author = authors.get(r.authorId);
    if (!author) continue;
    const media = await getPostMediaViews(r.id, r.mediaIds, args.viewerId);
    posts.push(rowToFeedPost(r, author, media, likedSet.has(r.id)));
  }

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = slice[slice.length - 1];
    if (last) {
      nextCursor = Buffer.from(
        JSON.stringify(
          args.sort === "trending"
            ? { s: computeTrendingScore(last), id: last.id }
            : {
                t: (last.publishedAt ?? last.createdAt).toISOString(),
                id: last.id,
              },
        ),
        "utf8",
      ).toString("base64url");
    }
  }

  return { posts, nextCursor };
}

/** Formation / Academy announcements only. */
export async function listFormationPosts(args: {
  viewerId: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<{ posts: FeedPostView[]; nextCursor: string | null }> {
  if (!communityEnabled()) return { posts: [], nextCursor: null };
  await ensureFeedReady();

  const limit = Math.min(args.limit ?? COMMUNITY_FEED_PAGE_SIZE, 40);
  const db = getDb();
  const blocked = args.viewerId
    ? await blockedUserIds(args.viewerId)
    : new Set<string>();

  let cursorDate: Date | null = null;
  let cursorId: string | null = null;
  if (args.cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(args.cursor, "base64url").toString("utf8"),
      ) as { t: string; id: string };
      cursorDate = new Date(parsed.t);
      cursorId = parsed.id;
    } catch {
      cursorDate = null;
    }
  }

  const formationStartAt = sql`coalesce((${communityPosts.meta}->>'startDate')::timestamptz, ${communityPosts.publishedAt})`;

  const conditions = [
    eq(communityPosts.status, "published"),
    eq(communityPosts.contentKind, "formation"),
  ];

  if (cursorDate && cursorId) {
    conditions.push(
      or(
        gt(formationStartAt, cursorDate),
        and(eq(formationStartAt, cursorDate), gt(communityPosts.id, cursorId)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(communityPosts)
    .where(and(...conditions))
    .orderBy(asc(formationStartAt), asc(communityPosts.id))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const authorIds = [...new Set(slice.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  const postIds = slice.map((r) => r.id);
  let likedSet = new Set<string>();
  if (args.viewerId && postIds.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, args.viewerId),
          eq(communityLikes.targetType, "post"),
          inArray(communityLikes.targetId, postIds),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  const posts: FeedPostView[] = [];
  for (const r of slice) {
    if (blocked.has(r.authorId)) continue;
    const author = authors.get(r.authorId);
    if (!author) continue;
    const media = await getPostMediaViews(r.id, r.mediaIds, args.viewerId);
    posts.push(rowToFeedPost(r, author, media, likedSet.has(r.id)));
  }

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = slice[slice.length - 1];
    const lastStart =
      parseFormationPostMeta(last?.meta, last?.body)?.startDate ??
      last?.publishedAt?.toISOString();
    if (lastStart && last?.id) {
      nextCursor = Buffer.from(
        JSON.stringify({
          t: lastStart,
          id: last.id,
        }),
        "utf8",
      ).toString("base64url");
    }
  }

  return { posts, nextCursor };
}

/** 1 lecture = 1 membre connecté ouvrant la page détail (1× par personne). */
export async function recordPostView(args: {
  postId: string;
  viewerId: string;
}): Promise<{ viewCount: number; recorded: boolean }> {
  await ensureFeedReady();
  const db = getDb();
  const inserted = await db
    .insert(communityPostViews)
    .values({ postId: args.postId, viewerId: args.viewerId })
    .onConflictDoNothing()
    .returning({ postId: communityPostViews.postId });

  if (!inserted.length) {
    const [current] = await db
      .select({ viewCount: communityPosts.viewCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, args.postId))
      .limit(1);
    return { viewCount: current?.viewCount ?? 0, recorded: false };
  }

  const [row] = await db
    .update(communityPosts)
    .set({ viewCount: sql`${communityPosts.viewCount} + 1` })
    .where(
      and(
        eq(communityPosts.id, args.postId),
        eq(communityPosts.status, "published"),
      ),
    )
    .returning({ viewCount: communityPosts.viewCount });

  return { viewCount: row?.viewCount ?? 0, recorded: true };
}

export async function createFeedPost(args: {
  authorId: string;
  body: string;
  postType?: "text" | "image" | "video";
  contentKind?: FeedComposerKind;
  mediaIds?: string[];
}): Promise<
  | {
      ok: true;
      post: FeedPostView;
      bpGranted: { granted: boolean; points: number };
    }
  | { ok: false; error: string }
> {
  if (!communityEnabled()) return { ok: false, error: "community_disabled" };
  await ensureFeedReady();

  const body = args.body.trim();
  const contentKind =
    args.contentKind && isFeedComposerKind(args.contentKind)
      ? args.contentKind
      : "news";
  const minLen = minBodyLengthForKind(contentKind);
  if (body.length < minLen || body.length > 4000) {
    return { ok: false, error: "community_post_length" };
  }

  const db = getDb();
  const [recent] = await db
    .select({ createdAt: communityPosts.createdAt })
    .from(communityPosts)
    .where(eq(communityPosts.authorId, args.authorId))
    .orderBy(desc(communityPosts.createdAt))
    .limit(1);

  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < POST_COOLDOWN_MS
  ) {
    return { ok: false, error: "community_post_cooldown" };
  }

  const moderation = await moderateCommunityText(body);
  if (!moderation.allowed) {
    return { ok: false, error: "community_content_blocked" };
  }

  const kind =
    args.postType === "video"
      ? "video"
      : args.postType === "image" || args.mediaIds?.length
        ? "image"
        : "text";

  await ensureCommunityProfile(args.authorId);

  const now = new Date();
  const [row] = await db
    .insert(communityPosts)
    .values({
      authorId: args.authorId,
      body,
      postType: kind,
      contentKind,
      status: "published",
      mediaIds: args.mediaIds?.length ? args.mediaIds : null,
      publishedAt: now,
    })
    .returning();

  if (!row) return { ok: false, error: "community_post_failed" };

  if (moderation.reviewQueue) {
    await reportCommunityContent({
      reporterId: args.authorId,
      targetType: "post",
      targetId: row.id,
      reason: "ai_review",
      details: `score=${moderation.score.toFixed(2)} categories=${moderation.categories.join(",")}`,
    });
  }

  await db
    .update(communityUserProfiles)
    .set({ postsCount: sql`${communityUserProfiles.postsCount} + 1` })
    .where(eq(communityUserProfiles.userId, args.authorId));

  const bp = await grantCommunityPostPublished({
    userId: args.authorId,
    postId: row.id,
    kind,
    bodyLength: body.length,
  });

  const author = await ensureCommunityProfile(args.authorId);
  const media = await getPostMediaViews(row.id, row.mediaIds, args.authorId);

  return {
    ok: true,
    bpGranted: { granted: bp.granted, points: bp.points },
    post: {
      id: row.id,
      body: row.body,
      postType: row.postType,
      contentKind: row.contentKind ?? "news",
      status: row.status,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      publishedAt: now.toISOString(),
      author,
      media,
      likedByMe: false,
      bpEarned: bp.points,
    },
  };
}

export async function deleteFeedPost(args: {
  postId: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  await ensureFeedReady();
  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  if (!post) return { ok: false, error: "not_found" };
  if (post.authorId !== args.userId) {
    return { ok: false, error: "forbidden" };
  }

  await db
    .update(communityPosts)
    .set({ status: "removed", updatedAt: new Date() })
    .where(eq(communityPosts.id, args.postId));

  await db
    .update(academyTrainingEvents)
    .set({ communityPostId: null, updatedAt: new Date() })
    .where(eq(academyTrainingEvents.communityPostId, args.postId));

  await db
    .update(communityUserProfiles)
    .set({
      postsCount: sql`GREATEST(0, ${communityUserProfiles.postsCount} - 1)`,
    })
    .where(eq(communityUserProfiles.userId, post.authorId));

  return { ok: true };
}

export async function hideFeedPost(args: {
  postId: string;
  userId: string;
  hidden: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  await ensureFeedReady();
  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  if (!post) return { ok: false, error: "not_found" };
  if (post.authorId !== args.userId) return { ok: false, error: "forbidden" };
  if (post.status === "removed") return { ok: false, error: "removed" };

  await db
    .update(communityPosts)
    .set({
      status: args.hidden ? "hidden" : "published",
      updatedAt: new Date(),
    })
    .where(eq(communityPosts.id, args.postId));

  return { ok: true };
}

export async function listAuthorFeedPosts(args: {
  authorId: string;
  viewerId: string | null;
  q?: string;
  cursor?: string | null;
  limit?: number;
  includeHidden?: boolean;
}): Promise<{ posts: FeedPostView[]; nextCursor: string | null }> {
  if (!communityEnabled()) return { posts: [], nextCursor: null };
  await ensureFeedReady();

  const limit = Math.min(args.limit ?? 15, 30);
  const db = getDb();
  const isOwner = args.viewerId === args.authorId;

  const statuses = args.includeHidden && isOwner
    ? (["published", "hidden"] as const)
    : (["published"] as const);

  let cursorDate: Date | null = null;
  let cursorId: string | null = null;
  if (args.cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(args.cursor, "base64url").toString("utf8"),
      ) as { t: string; id: string };
      cursorDate = new Date(parsed.t);
      cursorId = parsed.id;
    } catch {
      cursorDate = null;
    }
  }

  const conditions = [
    eq(communityPosts.authorId, args.authorId),
    inArray(communityPosts.status, [...statuses]),
  ];

  if (args.q?.trim()) {
    conditions.push(ilike(communityPosts.body, `%${args.q.trim()}%`));
  }

  if (cursorDate && cursorId) {
    conditions.push(
      or(
        lt(communityPosts.publishedAt, cursorDate),
        and(
          eq(communityPosts.publishedAt, cursorDate),
          lt(communityPosts.id, cursorId),
        ),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(communityPosts)
    .where(and(...conditions))
    .orderBy(desc(communityPosts.publishedAt), desc(communityPosts.id))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const authors = await getAuthorsMap([args.authorId]);
  const author = authors.get(args.authorId);
  if (!author) return { posts: [], nextCursor: null };

  const postIds = slice.map((r) => r.id);
  let likedSet = new Set<string>();
  if (args.viewerId && postIds.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, args.viewerId),
          eq(communityLikes.targetType, "post"),
          inArray(communityLikes.targetId, postIds),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  const posts: FeedPostView[] = [];
  for (const r of slice) {
    const media = await getPostMediaViews(r.id, r.mediaIds, args.viewerId);
    posts.push(rowToFeedPost(r, author, media, likedSet.has(r.id)));
  }

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = slice[slice.length - 1];
    if (last?.publishedAt) {
      nextCursor = Buffer.from(
        JSON.stringify({
          t: last.publishedAt.toISOString(),
          id: last.id,
        }),
        "utf8",
      ).toString("base64url");
    }
  }

  return { posts, nextCursor };
}

export async function togglePostLike(args: {
  userId: string;
  postId: string;
}): Promise<
  | { ok: true; liked: boolean; likeCount: number; bpGranted: number }
  | { ok: false; error: string }
> {
  await ensureFeedReady();
  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.id, args.postId),
        eq(communityPosts.status, "published"),
      ),
    )
    .limit(1);

  if (!post) return { ok: false, error: "not_found" };
  if (!(await assertNotBlocked(args.userId, post.authorId))) {
    return { ok: false, error: "blocked" };
  }

  const [existing] = await db
    .select({ id: communityLikes.id })
    .from(communityLikes)
    .where(
      and(
        eq(communityLikes.userId, args.userId),
        eq(communityLikes.targetType, "post"),
        eq(communityLikes.targetId, args.postId),
      ),
    )
    .limit(1);

  let bpGranted = 0;

  if (existing) {
    await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
    await db
      .update(communityPosts)
      .set({
        likeCount: sql`greatest(0, ${communityPosts.likeCount} - 1)`,
      })
      .where(eq(communityPosts.id, args.postId));
    const [u] = await db
      .select({ likeCount: communityPosts.likeCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, args.postId))
      .limit(1);
    return { ok: true, liked: false, likeCount: u?.likeCount ?? 0, bpGranted: 0 };
  }

  const [like] = await db
    .insert(communityLikes)
    .values({
      userId: args.userId,
      targetType: "post",
      targetId: args.postId,
    })
    .onConflictDoNothing()
    .returning({ id: communityLikes.id });

  if (!like) {
    return { ok: false, error: "like_failed" };
  }

  await db
    .update(communityPosts)
    .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
    .where(eq(communityPosts.id, args.postId));

  const grant = await grantCommunityLike({
    userId: args.userId,
    likeId: like.id,
    targetAuthorId: post.authorId,
    targetType: "post",
    targetId: args.postId,
  });
  bpGranted = grant.points;

  void notifyCommunityLike({
    postAuthorId: post.authorId,
    likerId: args.userId,
    postId: args.postId,
  });

  const [u] = await db
    .select({ likeCount: communityPosts.likeCount })
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  return {
    ok: true,
    liked: true,
    likeCount: u?.likeCount ?? 1,
    bpGranted,
  };
}

export type CommentView = {
  id: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  parentId: string | null;
  depth: number;
  author: CommunityAuthorView;
  replies: CommentView[];
};

function buildCommentTree(
  flat: Omit<CommentView, "replies" | "depth">[],
): CommentView[] {
  const byId = new Map<string, CommentView>();
  const roots: CommentView[] = [];

  for (const c of flat) {
    byId.set(c.id, { ...c, depth: 0, replies: [] });
  }

  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      const parent = byId.get(c.parentId)!;
      if (parent.depth < 2) {
        c.depth = parent.depth + 1;
        parent.replies.push(c);
      } else {
        roots.push(c);
      }
    } else {
      roots.push(c);
    }
  }

  const sortRec = (list: CommentView[]) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const n of list) sortRec(n.replies);
  };
  sortRec(roots);
  return roots;
}

export async function getFeedPostById(args: {
  postId: string;
  viewerId: string | null;
}): Promise<FeedPostView | null> {
  if (!communityEnabled()) return null;
  await ensureFeedReady();
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.id, args.postId),
        inArray(communityPosts.status, ["published", "hidden"]),
      ),
    )
    .limit(1);
  if (!row) return null;
  if (row.status === "hidden" && row.authorId !== args.viewerId) return null;

  const blocked = args.viewerId
    ? await blockedUserIds(args.viewerId)
    : new Set<string>();
  if (blocked.has(row.authorId)) return null;

  const authors = await getAuthorsMap([row.authorId]);
  const author = authors.get(row.authorId);
  if (!author) return null;

  let likedByMe = false;
  if (args.viewerId) {
    const [like] = await db
      .select({ id: communityLikes.id })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, args.viewerId),
          eq(communityLikes.targetType, "post"),
          eq(communityLikes.targetId, row.id),
        ),
      )
      .limit(1);
    likedByMe = !!like;
  }

  if (row.status === "hidden" && row.authorId !== args.viewerId) {
    return null;
  }

  const media = await getPostMediaViews(row.id, row.mediaIds, args.viewerId);
  return rowToFeedPost(row, author, media, likedByMe);
}

export async function listPostComments(
  postId: string,
  viewerId: string | null = null,
  limit = 60,
): Promise<CommentView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityComments)
    .where(
      and(
        eq(communityComments.postId, postId),
        isNull(communityComments.mediaId),
      ),
    )
    .orderBy(communityComments.createdAt)
    .limit(Math.min(limit, 120));

  const authors = await getAuthorsMap(rows.map((r) => r.authorId));

  let likedSet = new Set<string>();
  if (viewerId && rows.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, viewerId),
          eq(communityLikes.targetType, "comment"),
          inArray(
            communityLikes.targetId,
            rows.map((r) => r.id),
          ),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  const flat = rows
    .map((r) => {
      const author = authors.get(r.authorId);
      if (!author) return null;
      return {
        id: r.id,
        body: r.body,
        likeCount: r.likeCount,
        likedByMe: likedSet.has(r.id),
        createdAt: r.createdAt.toISOString(),
        parentId: r.parentId,
        author,
      };
    })
    .filter((x): x is Omit<CommentView, "replies" | "depth"> => x !== null);

  return buildCommentTree(flat);
}

export async function toggleCommentLike(args: {
  userId: string;
  commentId: string;
}): Promise<
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [comment] = await db
    .select()
    .from(communityComments)
    .where(eq(communityComments.id, args.commentId))
    .limit(1);
  if (!comment) return { ok: false, error: "not_found" };
  if (!(await assertNotBlocked(args.userId, comment.authorId))) {
    return { ok: false, error: "blocked" };
  }

  const [existing] = await db
    .select({ id: communityLikes.id })
    .from(communityLikes)
    .where(
      and(
        eq(communityLikes.userId, args.userId),
        eq(communityLikes.targetType, "comment"),
        eq(communityLikes.targetId, args.commentId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
    await db
      .update(communityComments)
      .set({
        likeCount: sql`greatest(0, ${communityComments.likeCount} - 1)`,
      })
      .where(eq(communityComments.id, args.commentId));
    const [u] = await db
      .select({ likeCount: communityComments.likeCount })
      .from(communityComments)
      .where(eq(communityComments.id, args.commentId))
      .limit(1);
    return { ok: true, liked: false, likeCount: u?.likeCount ?? 0 };
  }

  await db.insert(communityLikes).values({
    userId: args.userId,
    targetType: "comment",
    targetId: args.commentId,
  });

  await db
    .update(communityComments)
    .set({ likeCount: sql`${communityComments.likeCount} + 1` })
    .where(eq(communityComments.id, args.commentId));

  const [u] = await db
    .select({ likeCount: communityComments.likeCount })
    .from(communityComments)
    .where(eq(communityComments.id, args.commentId))
    .limit(1);

  return { ok: true, liked: true, likeCount: u?.likeCount ?? 1 };
}

export async function addPostComment(args: {
  userId: string;
  postId: string;
  body: string;
  parentId?: string | null;
}): Promise<
  | { ok: true; comment: CommentView; bpGranted: number }
  | { ok: false; error: string }
> {
  await ensureFeedReady();
  const body = args.body.trim();
  if (body.length < 2 || body.length > 1200) {
    return { ok: false, error: "community_comment_length" };
  }

  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.id, args.postId),
        eq(communityPosts.status, "published"),
      ),
    )
    .limit(1);

  if (!post) return { ok: false, error: "not_found" };
  if (!(await assertNotBlocked(args.userId, post.authorId))) {
    return { ok: false, error: "blocked" };
  }

  const moderation = await moderateCommunityText(body);
  if (!moderation.allowed) {
    return { ok: false, error: "community_content_blocked" };
  }

  await ensureCommunityProfile(args.userId);

  let parentId: string | null = args.parentId ?? null;
  if (parentId) {
    const [parent] = await db
      .select({
        id: communityComments.id,
        parentId: communityComments.parentId,
      })
      .from(communityComments)
      .where(
        and(
          eq(communityComments.id, parentId),
          eq(communityComments.postId, args.postId),
        ),
      )
      .limit(1);
    if (!parent) return { ok: false, error: "parent_not_found" };
    if (parent.parentId) {
      const [grand] = await db
        .select({ parentId: communityComments.parentId })
        .from(communityComments)
        .where(eq(communityComments.id, parent.parentId))
        .limit(1);
      if (grand?.parentId) parentId = parent.id;
    }
  }

  const [row] = await db
    .insert(communityComments)
    .values({
      postId: args.postId,
      authorId: args.userId,
      body,
      parentId,
    })
    .returning();

  if (!row) return { ok: false, error: "comment_failed" };

  if (moderation.reviewQueue) {
    await reportCommunityContent({
      reporterId: args.userId,
      targetType: "comment",
      targetId: row.id,
      reason: "ai_review",
      details: `score=${moderation.score.toFixed(2)} categories=${moderation.categories.join(",")}`,
    });
  }

  await db
    .update(communityPosts)
    .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
    .where(eq(communityPosts.id, args.postId));

  const bp = await grantCommunityComment({
    userId: args.userId,
    commentId: row.id,
    postId: args.postId,
    bodyLength: body.length,
    postAuthorId: post.authorId,
  });

  void notifyCommunityComment({
    postAuthorId: post.authorId,
    commenterId: args.userId,
    postId: args.postId,
    commentId: row.id,
    preview: body,
  });

  const author = await ensureCommunityProfile(args.userId);

  return {
    ok: true,
    bpGranted: bp.points,
    comment: {
      id: row.id,
      body: row.body,
      likeCount: 0,
      likedByMe: false,
      createdAt: row.createdAt.toISOString(),
      parentId: row.parentId,
      depth: parentId ? 1 : 0,
      author,
      replies: [],
    },
  };
}

export async function getPublicPostForShare(
  postId: string,
): Promise<PublicPostShareView | null> {
  if (!communityEnabled()) return null;
  await ensureFeedReady();

  const db = getDb();
  const [row] = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.id, postId),
        eq(communityPosts.status, "published"),
      ),
    )
    .limit(1);
  if (!row) return null;

  const authors = await getAuthorsMap([row.authorId]);
  const author = authors.get(row.authorId);
  if (!author) return null;

  const media = await getPostMediaViews(postId, row.mediaIds, null);
  return {
    id: row.id,
    body: row.body,
    authorHandle: author.handle,
    authorDisplayName: author.displayName,
    imageUrl: media[0]?.url ?? null,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
  };
}

export async function recordPostShare(args: {
  userId: string;
  postId: string;
}): Promise<{ ok: boolean; bpGranted: number; shareCount: number }> {
  await ensureFeedReady();
  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  if (!post) return { ok: false, bpGranted: 0, shareCount: 0 };

  await db
    .update(communityPosts)
    .set({ shareCount: sql`${communityPosts.shareCount} + 1` })
    .where(eq(communityPosts.id, args.postId));

  const bp = await grantCommunityShare({
    userId: args.userId,
    postId: args.postId,
  });

  const [u] = await db
    .select({ shareCount: communityPosts.shareCount })
    .from(communityPosts)
    .where(eq(communityPosts.id, args.postId))
    .limit(1);

  return {
    ok: true,
    bpGranted: bp.points,
    shareCount: u?.shareCount ?? post.shareCount + 1,
  };
}

export async function reportCommunityContent(args: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<{ ok: boolean }> {
  const db = getDb();
  await db.insert(communityReports).values({
    reporterId: args.reporterId,
    targetType: args.targetType,
    targetId: args.targetId,
    reason: args.reason.slice(0, 32),
    details: args.details?.slice(0, 500) ?? null,
  });
  return { ok: true };
}
