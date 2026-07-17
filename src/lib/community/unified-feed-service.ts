import { listPublishedBlogs } from "@/lib/community/blog-service";
import { listDiscussions } from "@/lib/community/discussion-service";
import { listFeedPosts, listFormationPosts } from "@/lib/community/feed-service";
import { asMediaItemView, type MediaItemView } from "@/lib/community/media-types";
import type { CommunityContentKind } from "@/lib/community/post-types";
import type { BotTemplatePostMeta } from "@/lib/community/bot-template-post-meta";
import type { FormationPostMeta } from "@/lib/community/formation-post-meta";
import type { FeedPostView } from "@/lib/community/feed-service";
import type { CommunityAuthorView } from "@/lib/community/profile-service";
import { listQuestions } from "@/lib/community/qa-service";
import { listTradingSignals } from "@/lib/community/signals-service";
import { communityPostAppPath } from "@/lib/community/share-url";

export type CommunityFeedCategory =
  | "all"
  | "for_you"
  | "trending"
  | "following"
  | "news"
  | "discussions"
  | "training"
  | "blogs"
  | "questions"
  | "signals";

export type UnifiedFeedItem = {
  id: string;
  kind: CommunityContentKind;
  title: string | null;
  body: string;
  publishedAt: string;
  author: CommunityAuthorView;
  href: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  tipBpTotal?: number;
  tipMcbTotal?: number;
  boostedUntil?: string | null;
  likedByMe?: boolean;
  media: MediaItemView[];
  meta?: Record<string, string>;
  formationMeta?: FormationPostMeta | null;
  botTemplateMeta?: BotTemplatePostMeta | null;
};

function feedPostToUnifiedItem(p: FeedPostView): UnifiedFeedItem {
  const contentKind = p.contentKind ?? "news";
  const kind: CommunityContentKind =
    contentKind === "formation" ? "formation" : "news";
  return {
    id: p.id,
    kind,
    title: p.formationMeta?.title ?? null,
    body: p.body,
    publishedAt: p.publishedAt,
    author: p.author,
    href: communityPostAppPath(p.id),
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    shareCount: p.shareCount,
    viewCount: p.viewCount ?? 0,
    tipBpTotal: p.tipBpTotal ?? 0,
    tipMcbTotal: p.tipMcbTotal ?? 0,
    boostedUntil: p.boostedUntil ?? null,
    likedByMe: p.likedByMe,
    media: p.media,
    meta: { contentKind },
    formationMeta: p.formationMeta,
    botTemplateMeta: p.botTemplateMeta,
  };
}

function cursorKey(iso: string, id: string): string {
  return Buffer.from(JSON.stringify({ t: iso, id }), "utf8").toString(
    "base64url",
  );
}

function parseCursor(
  cursor: string | null | undefined,
): { t: string; id: string } | null {
  if (!cursor) return null;
  try {
    return JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { t: string; id: string };
  } catch {
    return null;
  }
}

function afterCursor(
  publishedAt: string,
  id: string,
  cursor: { t: string; id: string } | null,
): boolean {
  if (!cursor) return true;
  if (publishedAt < cursor.t) return true;
  if (publishedAt > cursor.t) return false;
  return id < cursor.id;
}

export async function listUnifiedFeed(args: {
  viewerId: string | null;
  category?: CommunityFeedCategory;
  cursor?: string | null;
  limit?: number;
}): Promise<{ items: UnifiedFeedItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 40);
  const category = args.category ?? "all";
  const cursor = parseCursor(args.cursor);
  const perSource = category === "all" ? 12 : limit + 1;

  const items: UnifiedFeedItem[] = [];

  /** « Tout » = publications récentes uniquement (pas tout le réseau mélangé). */
  if (category === "all") {
    const { posts, nextCursor } = await listFeedPosts({
      viewerId: args.viewerId,
      limit: limit + 1,
      cursor: args.cursor,
      sort: "recent",
    });
    const mapped: UnifiedFeedItem[] = posts.map(feedPostToUnifiedItem);
    return {
      items: mapped.slice(0, limit),
      nextCursor,
    };
  }

  if (category === "for_you") {
    const { posts, nextCursor } = await listFeedPosts({
      viewerId: args.viewerId,
      limit: limit + 1,
      cursor: args.cursor,
      sort: "for_you",
    });
    const mapped: UnifiedFeedItem[] = posts.map(feedPostToUnifiedItem);
    return {
      items: mapped.slice(0, limit),
      nextCursor,
    };
  }

  if (category === "following") {
    const { posts, nextCursor } = await listFeedPosts({
      viewerId: args.viewerId,
      limit: limit + 1,
      cursor: args.cursor,
      sort: "following",
    });
    const mapped: UnifiedFeedItem[] = posts.map(feedPostToUnifiedItem);
    return {
      items: mapped.slice(0, limit),
      nextCursor,
    };
  }

  if (category === "trending") {
    const { posts, nextCursor } = await listFeedPosts({
      viewerId: args.viewerId,
      limit: limit + 1,
      cursor: args.cursor,
      sort: "trending",
    });
    const mapped: UnifiedFeedItem[] = posts.map(feedPostToUnifiedItem);
    return {
      items: mapped.slice(0, limit),
      nextCursor,
    };
  }

  if (category === "news") {
    const { posts } = await listFeedPosts({
      viewerId: args.viewerId,
      limit: perSource,
      sort: "recent",
    });
    for (const p of posts) {
      if (category === "news" && p.contentKind === "formation") continue;
      items.push(feedPostToUnifiedItem(p));
    }
  }

  if (category === "training") {
    const { posts } = await listFormationPosts({
      viewerId: args.viewerId,
      limit: perSource,
      cursor: args.cursor,
    });
    for (const p of posts) {
      items.push(feedPostToUnifiedItem(p));
    }
    const slice = items
      .filter((i) => afterCursor(i.publishedAt, i.id, cursor))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const page = slice.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page,
      nextCursor:
        slice.length > limit && last
          ? cursorKey(last.publishedAt, last.id)
          : null,
    };
  }

  if (category === "discussions") {
    const { discussions } = await listDiscussions({
      viewerId: args.viewerId,
      limit: perSource,
      sort: "recent",
    });
    for (const d of discussions) {
      items.push({
        id: d.id,
        kind: "discussion",
        title: d.title,
        body: d.body,
        publishedAt: d.lastActivityAt,
        author: d.author,
        href: `/app/community/discussions/${d.id}`,
        likeCount: 0,
        commentCount: d.replyCount,
        shareCount: 0,
        viewCount: 0,
        media: [],
        meta: d.category
          ? {
              categoryFr: d.category.labelFr,
              categoryEn: d.category.labelEn,
            }
          : undefined,
      });
    }
  }

  if (category === "blogs") {
    const { posts } = await listPublishedBlogs({ limit: perSource });
    for (const p of posts) {
      items.push({
        id: p.id,
        kind: "article",
        title: p.title,
        body: p.excerpt || p.title,
        publishedAt: p.publishedAt,
        author: p.author,
        href: `/app/community/blogs/${p.slug}`,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        media: p.coverUrl
          ? [asMediaItemView({ id: p.id, url: p.coverUrl, variants: null })]
          : [],
      });
    }
  }

  if (category === "questions") {
    const questions = await listQuestions({ limit: perSource, sort: "open" });
    for (const q of questions) {
      items.push({
        id: q.id,
        kind: "question",
        title: q.title,
        body: q.body,
        publishedAt: q.createdAt,
        author: q.author,
        href: `/app/community/questions/${q.id}`,
        likeCount: 0,
        commentCount: q.answerCount,
        shareCount: 0,
        viewCount: 0,
        media: [],
      });
    }
  }

  if (category === "signals") {
    const { signals } = await listTradingSignals({
      limit: perSource,
      status: "open",
    });
    for (const s of signals) {
      items.push({
        id: s.id,
        kind: "signal",
        title: `${s.symbol} ${s.side.toUpperCase()}`,
        body: s.note,
        publishedAt: s.publishedAt,
        author: s.author,
        href: `/app/community/signals`,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        media: [],
        meta: {
          symbol: s.symbol,
          side: s.side,
          status: s.status,
        },
      });
    }
  }

  const sorted = items
    .filter((i) => afterCursor(i.publishedAt, i.id, cursor))
    .sort((a, b) => {
      const dt = b.publishedAt.localeCompare(a.publishedAt);
      if (dt !== 0) return dt;
      return b.id.localeCompare(a.id);
    });

  const slice = sorted.slice(0, limit);
  const last = slice[slice.length - 1];
  const nextCursor =
    sorted.length > limit && last
      ? cursorKey(last.publishedAt, last.id)
      : null;

  return { items: slice, nextCursor };
}
