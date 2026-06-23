import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { communityPosts, communityUserProfiles, getDb, users } from "@/db";
import { communityEnabled } from "@/lib/community/config";
import type { FeedPostView } from "@/lib/community/feed-service";
import { getPostMediaViews } from "@/lib/community/media-engagement-service";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import { extractHashtags } from "@/lib/community/link-embed";
import { getAuthorsMap } from "@/lib/community/profile-service";
import { searchTradingSignals, type TradingSignalView } from "@/lib/community/signals-service";

export type CommunitySearchHit = {
  id: string;
  body: string;
  postType: string;
  contentKind: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  publishedAt: string;
  author: FeedPostView["author"];
  media: FeedPostView["media"];
  hashtags: string[];
};

export async function searchCommunityPosts(args: {
  q: string;
  viewerId: string | null;
  limit?: number;
}): Promise<CommunitySearchHit[]> {
  if (!communityEnabled()) return [];

  const raw = args.q.trim();
  if (raw.length < 2) return [];
  await ensureCommunitySchema();

  const limit = Math.min(args.limit ?? 20, 40);
  const db = getDb();
  const isHashtag = raw.startsWith("#");
  const term = (isHashtag ? raw.slice(1) : raw).trim().toLowerCase();
  if (term.length < 2) return [];

  const pattern = isHashtag ? `%#${term}%` : `%${term}%`;

  const rows = await db
    .select()
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.status, "published"),
        ilike(communityPosts.body, pattern),
      ),
    )
    .orderBy(
      desc(
        sql`(${communityPosts.likeCount} + ${communityPosts.commentCount} + ${communityPosts.viewCount})`,
      ),
      desc(communityPosts.publishedAt),
    )
    .limit(limit);

  if (!rows.length) return [];

  const authors = await getAuthorsMap(rows.map((r) => r.authorId));
  const hits: CommunitySearchHit[] = [];

  for (const r of rows) {
    const author = authors.get(r.authorId);
    if (!author) continue;
    const media = await getPostMediaViews(r.id, r.mediaIds, args.viewerId);
    hits.push({
      id: r.id,
      body: r.body,
      postType: r.postType,
      contentKind: r.contentKind ?? "news",
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      shareCount: r.shareCount,
      viewCount: r.viewCount ?? 0,
      publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
      author,
      media,
      hashtags: extractHashtags(r.body),
    });
  }
  return hits;
}

export async function listPostsByHashtag(args: {
  tag: string;
  viewerId: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<{ hits: CommunitySearchHit[]; nextCursor: string | null }> {
  if (!communityEnabled()) return { hits: [], nextCursor: null };

  const tag = args.tag.trim().toLowerCase().replace(/^#/, "");
  if (tag.length < 2) return { hits: [], nextCursor: null };
  await ensureCommunitySchema();

  const limit = Math.min(args.limit ?? 20, 40);
  const db = getDb();
  const pattern = `%#${tag}%`;

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
      cursorId = null;
    }
  }

  const conditions = [
    eq(communityPosts.status, "published"),
    ilike(communityPosts.body, pattern),
  ];

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
  if (!slice.length) return { hits: [], nextCursor: null };

  const authors = await getAuthorsMap(slice.map((r) => r.authorId));
  const hits: CommunitySearchHit[] = [];

  for (const r of slice) {
    const author = authors.get(r.authorId);
    if (!author) continue;
    const media = await getPostMediaViews(r.id, r.mediaIds, args.viewerId);
    hits.push({
      id: r.id,
      body: r.body,
      postType: r.postType,
      contentKind: r.contentKind ?? "news",
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      shareCount: r.shareCount,
      viewCount: r.viewCount ?? 0,
      publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
      author,
      media,
      hashtags: extractHashtags(r.body),
    });
  }

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    const last = slice[slice.length - 1];
    if (last) {
      nextCursor = Buffer.from(
        JSON.stringify({
          t: (last.publishedAt ?? last.createdAt).toISOString(),
          id: last.id,
        }),
        "utf8",
      ).toString("base64url");
    }
  }

  return { hits, nextCursor };
}

export type CommunityProfileSearchHit = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  reputationScore: number;
};

export type CommunityUnifiedSearchResult = {
  posts: CommunitySearchHit[];
  profiles: CommunityProfileSearchHit[];
  signals: TradingSignalView[];
};

export async function searchCommunityUnified(args: {
  q: string;
  viewerId: string | null;
  limit?: number;
}): Promise<CommunityUnifiedSearchResult> {
  const raw = args.q.trim();
  if (raw.length < 2) {
    return { posts: [], profiles: [], signals: [] };
  }

  const limit = Math.min(args.limit ?? 8, 20);
  const posts = await searchCommunityPosts({
    q: raw,
    viewerId: args.viewerId,
    limit,
  });

  const term = raw.replace(/^[@#]/, "").trim().toLowerCase();
  const db = getDb();
  const profileRows = await db
    .select({
      handle: communityUserProfiles.handle,
      displayName: communityUserProfiles.displayName,
      reputationScore: communityUserProfiles.reputationScore,
      avatarUrl: users.avatarUrl,
    })
    .from(communityUserProfiles)
    .innerJoin(users, eq(users.id, communityUserProfiles.userId))
    .where(
      or(
        ilike(communityUserProfiles.handle, `%${term}%`),
        ilike(communityUserProfiles.displayName, `%${term}%`),
      ),
    )
    .limit(6);

  const profiles: CommunityProfileSearchHit[] = profileRows.map((r) => ({
    handle: r.handle,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    reputationScore: r.reputationScore,
  }));

  let signals: TradingSignalView[] = [];
  if (term.length >= 2) {
    signals = await searchTradingSignals({ q: term, limit: 6 });
  }

  return { posts, profiles, signals };
}
