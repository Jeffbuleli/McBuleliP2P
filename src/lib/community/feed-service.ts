import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import {
  communityComments,
  communityLikes,
  communityPosts,
  communityReports,
  communityTraderFollows,
  communityUserBlocks,
  getDb,
} from "@/db";
import { communityEnabled, COMMUNITY_FEED_PAGE_SIZE } from "@/lib/community/config";
import {
  notifyCommunityComment,
  notifyCommunityLike,
} from "@/lib/community/community-notifications";
import { getMediaUrls } from "@/lib/community/media-service";
import {
  ensureCommunityProfile,
  getAuthorsMap,
  type CommunityAuthorView,
} from "@/lib/community/profile-service";
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
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
  author: CommunityAuthorView;
  media: { id: string; url: string; variants: Record<string, string> | null }[];
  likedByMe: boolean;
  bpEarned?: number;
};

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

export async function listFeedPosts(args: {
  viewerId: string | null;
  cursor?: string | null;
  limit?: number;
  sort?: "recent" | "popular" | "following";
}): Promise<{ posts: FeedPostView[]; nextCursor: string | null }> {
  if (!communityEnabled()) return { posts: [], nextCursor: null };

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

  const conditions = [eq(communityPosts.status, "published")];

  if (args.sort === "following" && args.viewerId) {
    const follows = await db
      .select({ traderId: communityTraderFollows.traderId })
      .from(communityTraderFollows)
      .where(eq(communityTraderFollows.followerId, args.viewerId));
    const authorIds = follows.map((f) => f.traderId);
    if (!authorIds.length) return { posts: [], nextCursor: null };
    conditions.push(inArray(communityPosts.authorId, authorIds));
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

  const orderBy =
    args.sort === "popular"
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
    const media = await getMediaUrls(r.mediaIds);
    posts.push({
      id: r.id,
      body: r.body,
      postType: r.postType,
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      shareCount: r.shareCount,
      publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
      author,
      media,
      likedByMe: likedSet.has(r.id),
    });
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

export async function createFeedPost(args: {
  authorId: string;
  body: string;
  postType?: "text" | "image" | "video";
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

  const body = args.body.trim();
  if (body.length < 20 || body.length > 4000) {
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
      status: "published",
      mediaIds: args.mediaIds?.length ? args.mediaIds : null,
      publishedAt: now,
    })
    .returning();

  if (!row) return { ok: false, error: "community_post_failed" };

  const bp = await grantCommunityPostPublished({
    userId: args.authorId,
    postId: row.id,
    kind,
    bodyLength: body.length,
  });

  const author = await ensureCommunityProfile(args.authorId);
  const media = await getMediaUrls(row.mediaIds);

  return {
    ok: true,
    bpGranted: { granted: bp.granted, points: bp.points },
    post: {
      id: row.id,
      body: row.body,
      postType: row.postType,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
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

  return { ok: true };
}

export async function togglePostLike(args: {
  userId: string;
  postId: string;
}): Promise<
  | { ok: true; liked: boolean; likeCount: number; bpGranted: number }
  | { ok: false; error: string }
> {
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

export async function listPostComments(
  postId: string,
  limit = 60,
): Promise<CommentView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityComments)
    .where(eq(communityComments.postId, postId))
    .orderBy(communityComments.createdAt)
    .limit(Math.min(limit, 120));

  const authors = await getAuthorsMap(rows.map((r) => r.authorId));

  const flat = rows
    .map((r) => {
      const author = authors.get(r.authorId);
      if (!author) return null;
      return {
        id: r.id,
        body: r.body,
        likeCount: r.likeCount,
        createdAt: r.createdAt.toISOString(),
        parentId: r.parentId,
        author,
      };
    })
    .filter((x): x is Omit<CommentView, "replies" | "depth"> => x !== null);

  return buildCommentTree(flat);
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

  const media = await getMediaUrls(row.mediaIds);
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
