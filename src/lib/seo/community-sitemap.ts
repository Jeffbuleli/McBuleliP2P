import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { communityPosts, communityUserProfiles, getDb } from "@/db";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { communityEnabled } from "@/lib/community/config";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import { extractHashtags } from "@/lib/community/link-embed";
import { UTILITY_TAGS } from "@/lib/community/utility-tags";
import {
  communityHubSharePath,
  communityPostSharePath,
  communityProfileCanonicalPath,
  communityTagSharePath,
} from "@/lib/community/share-url";
import { COMMUNITY_SEO_TAGS } from "@/lib/seo/site";

const MAX_POSTS = 200;
const MAX_PROFILES = 100;
const MAX_DYNAMIC_TAGS = 80;

/**
 * Dynamic Community URLs for Google sitemap (public /community/* only).
 */
export async function buildCommunitySitemapEntries(): Promise<
  MetadataRoute.Sitemap
> {
  const base = CANONICAL_PRODUCTION_ORIGIN;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}${communityHubSharePath()}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.85,
    },
  ];

  if (!communityEnabled()) return entries;

  try {
    await ensureCommunitySchema();
    const db = getDb();

    const posts = await db
      .select({
        id: communityPosts.id,
        publishedAt: communityPosts.publishedAt,
        body: communityPosts.body,
      })
      .from(communityPosts)
      .where(eq(communityPosts.status, "published"))
      .orderBy(desc(communityPosts.publishedAt))
      .limit(MAX_POSTS);

    for (const p of posts) {
      entries.push({
        url: `${base}${communityPostSharePath(p.id)}`,
        lastModified: p.publishedAt ?? now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    const profiles = await db
      .select({
        handle: communityUserProfiles.handle,
        updatedAt: communityUserProfiles.updatedAt,
      })
      .from(communityUserProfiles)
      .orderBy(desc(communityUserProfiles.reputationScore))
      .limit(MAX_PROFILES);

    for (const p of profiles) {
      entries.push({
        url: `${base}${communityProfileCanonicalPath(p.handle)}`,
        lastModified: p.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.65,
      });
    }

    const tagScore = new Map<string, number>();
    for (const seed of [...COMMUNITY_SEO_TAGS, ...UTILITY_TAGS]) {
      tagScore.set(seed, 10);
    }
    for (const p of posts) {
      for (const tag of extractHashtags(p.body)) {
        tagScore.set(tag, (tagScore.get(tag) ?? 0) + 1);
      }
    }

    // Also pull a few bodies with # from older/hot posts if needed
    if (tagScore.size < 20) {
      const tagged = await db
        .select({ body: communityPosts.body })
        .from(communityPosts)
        .where(
          and(
            eq(communityPosts.status, "published"),
            sql`${communityPosts.body} ilike '%#%'`,
          ),
        )
        .orderBy(
          desc(
            sql`(${communityPosts.likeCount} + ${communityPosts.viewCount})`,
          ),
        )
        .limit(80);
      for (const row of tagged) {
        for (const tag of extractHashtags(row.body)) {
          tagScore.set(tag, (tagScore.get(tag) ?? 0) + 1);
        }
      }
    }

    const topTags = [...tagScore.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_DYNAMIC_TAGS)
      .map(([t]) => t);

    for (const tag of topTags) {
      entries.push({
        url: `${base}${communityTagSharePath(tag)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.75,
      });
    }
  } catch {
    /* sitemap must not break the whole site */
  }

  return entries;
}
