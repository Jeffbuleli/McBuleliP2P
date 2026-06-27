import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import {
  communityComments,
  communityLikes,
  communityMedia,
  communityPosts,
  communityUserBlocks,
  getDb,
} from "@/db";
import {
  ensureCommunityProfile,
  getAuthorsMap,
  type CommunityAuthorView,
} from "@/lib/community/profile-service";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import type { MediaCommentView, MediaItemView } from "@/lib/community/media-types";

export type { MediaCommentView, MediaItemView } from "@/lib/community/media-types";
export { asMediaItemView, mediaDisplayUrl } from "@/lib/community/media-types";

async function assertNotBlocked(
  viewerId: string,
  authorId: string,
): Promise<boolean> {
  const db = getDb();
  const [block] = await db
    .select({ id: communityUserBlocks.id })
    .from(communityUserBlocks)
    .where(
      and(
        eq(communityUserBlocks.blockerId, viewerId),
        eq(communityUserBlocks.blockedId, authorId),
      ),
    )
    .limit(1);
  return !block;
}

export async function getPostMediaViews(
  postId: string,
  mediaIds: string[] | null | undefined,
  viewerId: string | null,
): Promise<MediaItemView[]> {
  if (!mediaIds?.length) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.status, "ready"),
        inArray(communityMedia.id, mediaIds),
      ),
    );

  const order = new Map(mediaIds.map((id, i) => [id, i]));
  rows.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );

  let likedSet = new Set<string>();
  if (viewerId && rows.length) {
    const likes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, viewerId),
          eq(communityLikes.targetType, "media"),
          inArray(
            communityLikes.targetId,
            rows.map((r) => r.id),
          ),
        ),
      );
    likedSet = new Set(likes.map((l) => l.targetId));
  }

  return rows.map((r) => ({
    id: r.id,
    url: normalizePublicMediaUrl(r.publicUrl) ?? r.publicUrl,
    variants: r.variants,
    fileType: r.fileType,
    mimeType: r.mimeType,
    likeCount: r.likeCount ?? 0,
    commentCount: r.commentCount ?? 0,
    shareCount: r.shareCount ?? 0,
    likedByMe: likedSet.has(r.id),
  }));
}

export async function getPostMediaItem(args: {
  postId: string;
  mediaId: string;
  viewerId: string | null;
}): Promise<
  | {
      ok: true;
      media: MediaItemView;
      postBody: string;
      author: CommunityAuthorView;
      publishedAt: string;
      postIndex: number;
      postMediaCount: number;
    }
  | { ok: false; error: string }
> {
  await ensureCommunitySchema();
  const db = getDb();
  const [post] = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.id, args.postId),
        inArray(communityPosts.status, ["published", "hidden"]),
      ),
    )
    .limit(1);

  if (!post) return { ok: false, error: "not_found" };
  const ids = post.mediaIds ?? [];
  if (!ids.includes(args.mediaId)) return { ok: false, error: "not_found" };

  if (post.status === "hidden" && post.authorId !== args.viewerId) {
    return { ok: false, error: "not_found" };
  }

  const [media] = await getPostMediaViews(args.postId, [args.mediaId], args.viewerId);
  if (!media) return { ok: false, error: "not_found" };

  const authors = await getAuthorsMap([post.authorId]);
  const author = authors.get(post.authorId);
  if (!author) return { ok: false, error: "not_found" };

  return {
    ok: true,
    media,
    postBody: post.body,
    author,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    postIndex: ids.indexOf(args.mediaId) + 1,
    postMediaCount: ids.length,
  };
}

export async function toggleMediaLike(args: {
  userId: string;
  mediaId: string;
}): Promise<
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [media] = await db
    .select()
    .from(communityMedia)
    .where(
      and(eq(communityMedia.id, args.mediaId), eq(communityMedia.status, "ready")),
    )
    .limit(1);
  if (!media) return { ok: false, error: "not_found" };

  const [existing] = await db
    .select({ id: communityLikes.id })
    .from(communityLikes)
    .where(
      and(
        eq(communityLikes.userId, args.userId),
        eq(communityLikes.targetType, "media"),
        eq(communityLikes.targetId, args.mediaId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(communityLikes).where(eq(communityLikes.id, existing.id));
    await db
      .update(communityMedia)
      .set({ likeCount: sql`greatest(0, ${communityMedia.likeCount} - 1)` })
      .where(eq(communityMedia.id, args.mediaId));
    const [u] = await db
      .select({ likeCount: communityMedia.likeCount })
      .from(communityMedia)
      .where(eq(communityMedia.id, args.mediaId))
      .limit(1);
    return { ok: true, liked: false, likeCount: u?.likeCount ?? 0 };
  }

  await db
    .insert(communityLikes)
    .values({
      userId: args.userId,
      targetType: "media",
      targetId: args.mediaId,
    })
    .onConflictDoNothing();

  await db
    .update(communityMedia)
    .set({ likeCount: sql`${communityMedia.likeCount} + 1` })
    .where(eq(communityMedia.id, args.mediaId));

  const [u] = await db
    .select({ likeCount: communityMedia.likeCount })
    .from(communityMedia)
    .where(eq(communityMedia.id, args.mediaId))
    .limit(1);

  return { ok: true, liked: true, likeCount: u?.likeCount ?? 1 };
}

export async function shareMedia(args: {
  userId: string;
  mediaId: string;
  postId: string;
}): Promise<{ ok: true; shareCount: number } | { ok: false; error: string }> {
  const item = await getPostMediaItem({
    postId: args.postId,
    mediaId: args.mediaId,
    viewerId: args.userId,
  });
  if (!item.ok) return { ok: false, error: item.error };

  const db = getDb();
  await db
    .update(communityMedia)
    .set({ shareCount: sql`${communityMedia.shareCount} + 1` })
    .where(eq(communityMedia.id, args.mediaId));

  const [u] = await db
    .select({ shareCount: communityMedia.shareCount })
    .from(communityMedia)
    .where(eq(communityMedia.id, args.mediaId))
    .limit(1);

  return { ok: true, shareCount: u?.shareCount ?? 1 };
}

export async function listMediaComments(
  mediaId: string,
  viewerId: string | null,
  limit = 40,
): Promise<MediaCommentView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityComments)
    .where(
      and(
        eq(communityComments.mediaId, mediaId),
        isNull(communityComments.parentId),
      ),
    )
    .orderBy(communityComments.createdAt)
    .limit(Math.min(limit, 80));

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

  return rows
    .map((r) => {
      const author = authors.get(r.authorId);
      if (!author) return null;
      return {
        id: r.id,
        body: r.body,
        likeCount: r.likeCount,
        likedByMe: likedSet.has(r.id),
        createdAt: r.createdAt.toISOString(),
        author,
      };
    })
    .filter((x): x is MediaCommentView => x !== null);
}

export async function addMediaComment(args: {
  userId: string;
  postId: string;
  mediaId: string;
  body: string;
}): Promise<
  | { ok: true; comment: MediaCommentView }
  | { ok: false; error: string }
> {
  const body = args.body.trim();
  if (body.length < 2 || body.length > 1200) {
    return { ok: false, error: "community_comment_length" };
  }

  const item = await getPostMediaItem({
    postId: args.postId,
    mediaId: args.mediaId,
    viewerId: args.userId,
  });
  if (!item.ok) return { ok: false, error: item.error };
  if (!(await assertNotBlocked(args.userId, item.author.userId))) {
    return { ok: false, error: "blocked" };
  }

  await ensureCommunityProfile(args.userId);
  const db = getDb();

  const [row] = await db
    .insert(communityComments)
    .values({
      postId: args.postId,
      mediaId: args.mediaId,
      authorId: args.userId,
      body,
      parentId: null,
    })
    .returning();

  if (!row) return { ok: false, error: "comment_failed" };

  await db
    .update(communityMedia)
    .set({ commentCount: sql`${communityMedia.commentCount} + 1` })
    .where(eq(communityMedia.id, args.mediaId));

  await db
    .update(communityPosts)
    .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
    .where(eq(communityPosts.id, args.postId));

  const author = await ensureCommunityProfile(args.userId);
  return {
    ok: true,
    comment: {
      id: row.id,
      body: row.body,
      likeCount: 0,
      likedByMe: false,
      createdAt: row.createdAt.toISOString(),
      author,
    },
  };
}
