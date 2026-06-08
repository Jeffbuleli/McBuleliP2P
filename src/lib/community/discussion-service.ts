import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import {
  communityDiscussionCategories,
  communityDiscussionFollows,
  communityDiscussionReplies,
  communityDiscussions,
  getDb,
} from "@/db";
import {
  getAuthorsMap,
  type CommunityAuthorView,
} from "@/lib/community/profile-service";

export type DiscussionCategoryView = {
  id: string;
  slug: string;
  labelFr: string;
  labelEn: string;
};

export type DiscussionListItem = {
  id: string;
  title: string;
  body: string;
  replyCount: number;
  followCount: number;
  lastActivityAt: string;
  createdAt: string;
  author: CommunityAuthorView;
  category: DiscussionCategoryView | null;
  followedByMe: boolean;
};

export type DiscussionReplyView = {
  id: string;
  body: string;
  createdAt: string;
  author: CommunityAuthorView;
};

export type DiscussionDetail = DiscussionListItem & {
  replies: DiscussionReplyView[];
};

export async function listDiscussionCategories(): Promise<DiscussionCategoryView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityDiscussionCategories)
    .orderBy(communityDiscussionCategories.sortOrder);
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    labelFr: r.labelFr,
    labelEn: r.labelEn,
  }));
}

async function mapDiscussions(
  rows: (typeof communityDiscussions.$inferSelect)[],
  viewerId: string | null,
): Promise<DiscussionListItem[]> {
  if (!rows.length) return [];
  const db = getDb();
  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  const catIds = [
    ...new Set(rows.map((r) => r.categoryId).filter(Boolean)),
  ] as string[];
  const cats =
    catIds.length > 0
      ? await db
          .select()
          .from(communityDiscussionCategories)
          .where(inArray(communityDiscussionCategories.id, catIds))
      : [];
  const catById = new Map(cats.map((c) => [c.id, c]));

  let followed = new Set<string>();
  if (viewerId) {
    const f = await db
      .select({ discussionId: communityDiscussionFollows.discussionId })
      .from(communityDiscussionFollows)
      .where(eq(communityDiscussionFollows.userId, viewerId));
    followed = new Set(f.map((x) => x.discussionId));
  }

  return rows.map((r) => {
    const cat = r.categoryId ? catById.get(r.categoryId) : null;
    return {
      id: r.id,
      title: r.title,
      body: r.body.slice(0, 200),
      replyCount: r.replyCount,
      followCount: r.followCount,
      lastActivityAt: r.lastActivityAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      author: authors.get(r.authorId)!,
      category: cat
        ? { id: cat.id, slug: cat.slug, labelFr: cat.labelFr, labelEn: cat.labelEn }
        : null,
      followedByMe: followed.has(r.id),
    };
  });
}

export async function listDiscussions(args: {
  viewerId: string | null;
  sort?: "recent" | "popular" | "following";
  categorySlug?: string;
  cursor?: string | null;
  limit?: number;
}): Promise<{ discussions: DiscussionListItem[]; nextCursor: string | null }> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 40);

  let categoryId: string | undefined;
  if (args.categorySlug) {
    const [cat] = await db
      .select({ id: communityDiscussionCategories.id })
      .from(communityDiscussionCategories)
      .where(eq(communityDiscussionCategories.slug, args.categorySlug))
      .limit(1);
    categoryId = cat?.id;
    if (!categoryId) return { discussions: [], nextCursor: null };
  }

  const conditions = [];
  if (categoryId) conditions.push(eq(communityDiscussions.categoryId, categoryId));
  if (args.cursor) {
    conditions.push(
      lt(communityDiscussions.lastActivityAt, new Date(args.cursor)),
    );
  }

  if (args.sort === "following" && args.viewerId) {
    const follows = await db
      .select({ discussionId: communityDiscussionFollows.discussionId })
      .from(communityDiscussionFollows)
      .where(eq(communityDiscussionFollows.userId, args.viewerId));
    const ids = follows.map((f) => f.discussionId);
    if (!ids.length) return { discussions: [], nextCursor: null };
    conditions.push(inArray(communityDiscussions.id, ids));
  }

  const orderBy =
    args.sort === "popular"
      ? [desc(communityDiscussions.replyCount), desc(communityDiscussions.lastActivityAt)]
      : [desc(communityDiscussions.lastActivityAt)];

  const rows = await db
    .select()
    .from(communityDiscussions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const discussions = await mapDiscussions(slice, args.viewerId);
  const nextCursor =
    rows.length > limit
      ? slice[slice.length - 1]!.lastActivityAt.toISOString()
      : null;

  return { discussions, nextCursor };
}

export async function getDiscussionDetail(args: {
  discussionId: string;
  viewerId: string | null;
}): Promise<DiscussionDetail | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityDiscussions)
    .where(eq(communityDiscussions.id, args.discussionId))
    .limit(1);
  if (!row) return null;

  const [item] = await mapDiscussions([row], args.viewerId);
  const replies = await db
    .select()
    .from(communityDiscussionReplies)
    .where(eq(communityDiscussionReplies.discussionId, row.id))
    .orderBy(communityDiscussionReplies.createdAt);

  const authorIds = [...new Set(replies.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  return {
    ...item!,
    body: row.body,
    replies: replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: authors.get(r.authorId)!,
    })),
  };
}

export async function createDiscussion(args: {
  authorId: string;
  title: string;
  body: string;
  categoryId?: string;
}): Promise<
  | { ok: true; discussion: DiscussionListItem }
  | { ok: false; error: string }
> {
  if (args.title.trim().length < 8) return { ok: false, error: "title_too_short" };
  if (args.body.trim().length < 20) return { ok: false, error: "body_too_short" };

  const db = getDb();
  const [row] = await db
    .insert(communityDiscussions)
    .values({
      authorId: args.authorId,
      title: args.title.trim().slice(0, 200),
      body: args.body.trim(),
      categoryId: args.categoryId ?? null,
    })
    .returning();

  const [discussion] = await mapDiscussions([row!], args.authorId);
  return { ok: true, discussion: discussion! };
}

export async function replyToDiscussion(args: {
  authorId: string;
  discussionId: string;
  body: string;
}): Promise<
  | { ok: true; reply: DiscussionReplyView }
  | { ok: false; error: string }
> {
  if (args.body.trim().length < 10) return { ok: false, error: "body_too_short" };

  const db = getDb();
  const [disc] = await db
    .select({ id: communityDiscussions.id })
    .from(communityDiscussions)
    .where(eq(communityDiscussions.id, args.discussionId))
    .limit(1);
  if (!disc) return { ok: false, error: "not_found" };

  const [row] = await db
    .insert(communityDiscussionReplies)
    .values({
      discussionId: args.discussionId,
      authorId: args.authorId,
      body: args.body.trim(),
    })
    .returning();

  await db
    .update(communityDiscussions)
    .set({
      replyCount: sql`${communityDiscussions.replyCount} + 1`,
      lastActivityAt: new Date(),
    })
    .where(eq(communityDiscussions.id, args.discussionId));

  const authors = await getAuthorsMap([args.authorId]);
  return {
    ok: true,
    reply: {
      id: row!.id,
      body: row!.body,
      createdAt: row!.createdAt.toISOString(),
      author: authors.get(args.authorId)!,
    },
  };
}

export async function toggleDiscussionFollow(args: {
  userId: string;
  discussionId: string;
  follow: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (args.follow) {
    try {
      await db.insert(communityDiscussionFollows).values({
        userId: args.userId,
        discussionId: args.discussionId,
      });
      await db
        .update(communityDiscussions)
        .set({ followCount: sql`${communityDiscussions.followCount} + 1` })
        .where(eq(communityDiscussions.id, args.discussionId));
    } catch {
      return { ok: true };
    }
  } else {
    await db
      .delete(communityDiscussionFollows)
      .where(
        and(
          eq(communityDiscussionFollows.userId, args.userId),
          eq(communityDiscussionFollows.discussionId, args.discussionId),
        ),
      );
    await db
      .update(communityDiscussions)
      .set({
        followCount: sql`greatest(0, ${communityDiscussions.followCount} - 1)`,
      })
      .where(eq(communityDiscussions.id, args.discussionId));
  }
  return { ok: true };
}
