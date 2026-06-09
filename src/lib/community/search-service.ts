import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { communityPosts, getDb } from "@/db";
import { communityEnabled } from "@/lib/community/config";
import type { FeedPostView } from "@/lib/community/feed-service";
import { getMediaUrls } from "@/lib/community/media-service";
import { extractHashtags } from "@/lib/community/link-embed";
import { getAuthorsMap } from "@/lib/community/profile-service";

export type CommunitySearchHit = {
  id: string;
  body: string;
  postType: string;
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
    const media = await getMediaUrls(r.mediaIds);
    hits.push({
      id: r.id,
      body: r.body,
      postType: r.postType,
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
