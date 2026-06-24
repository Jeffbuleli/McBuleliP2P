import "server-only";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  communityMedia,
  communityStories,
  communityStoryReactions,
  communityStoryViews,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { normalizeStoryTextBg } from "@/lib/community/story-text-colors";
import type {
  CommunityStoryItem,
  CommunityStoryRing,
  StoryEngagement,
  StoryReactionCount,
  StoryReactionEmoji,
} from "@/lib/community/story-types";
import { STORY_REACTION_EMOJIS } from "@/lib/community/story-types";

export type {
  CommunityStoryItem,
  CommunityStoryRing,
  StoryEngagement,
  StoryReactionCount,
  StoryReactionEmoji,
};
export { STORY_REACTION_EMOJIS };

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_STORIES_PER_DAY = 8;

function isMissingTable(e: unknown): boolean {
  let cur: unknown = e;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!cur || typeof cur !== "object") break;
    const anyE = cur as { code?: unknown; message?: unknown; cause?: unknown };
    if (anyE.code === "42P01") return true;
    const msg = String(anyE.message ?? "");
    if (
      msg.includes("42P01") ||
      msg.includes('relation "community_stories" does not exist')
    ) {
      return true;
    }
    cur = anyE.cause;
  }
  return false;
}

export async function listActiveStoryRings(args: {
  viewerId: string | null;
}): Promise<{ rings: CommunityStoryRing[] }> {
  try {
    const db = getDb();
    const now = new Date();

    const rows = await db
      .select({
        id: communityStories.id,
        authorId: communityStories.authorId,
        storyType: communityStories.storyType,
        body: communityStories.body,
        mediaUrl: communityStories.mediaUrl,
        bgColor: communityStories.bgColor,
        createdAt: communityStories.createdAt,
        expiresAt: communityStories.expiresAt,
        handle: communityUserProfiles.handle,
        displayName: communityUserProfiles.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(communityStories)
      .innerJoin(users, eq(users.id, communityStories.authorId))
      .leftJoin(
        communityUserProfiles,
        eq(communityUserProfiles.userId, communityStories.authorId),
      )
      .where(
        and(
          eq(communityStories.status, "active"),
          gt(communityStories.expiresAt, now),
        ),
      )
      .orderBy(desc(communityStories.createdAt));

    const byAuthor = new Map<string, CommunityStoryRing>();
    const storyIds: string[] = [];

    for (const row of rows) {
      const handle = row.handle ?? row.authorId.slice(0, 8);
      const displayName = row.displayName ?? handle;
      let ring = byAuthor.get(row.authorId);
      if (!ring) {
        const latest = {
          type: row.storyType as CommunityStoryItem["type"],
          body: row.body,
          mediaUrl: row.mediaUrl,
          bgColor: row.bgColor,
        };
        ring = {
          userId: row.authorId,
          handle,
          displayName,
          avatarUrl: row.avatarUrl ?? null,
          isMe: args.viewerId === row.authorId,
          hasUnseen: false,
          previewType: latest.type,
          previewUrl: latest.type !== "text" ? latest.mediaUrl : null,
          previewBg:
            latest.type === "text"
              ? normalizeStoryTextBg(latest.bgColor)
              : null,
          previewText: latest.type === "text" ? latest.body : null,
          stories: [],
        };
        byAuthor.set(row.authorId, ring);
      }
      storyIds.push(row.id);
      ring.stories.push({
        id: row.id,
        type: row.storyType as CommunityStoryItem["type"],
        body: row.body,
        mediaUrl: row.mediaUrl,
        bgColor:
          row.storyType === "text"
            ? normalizeStoryTextBg(row.bgColor)
            : row.bgColor,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      });
    }

    if (args.viewerId && storyIds.length) {
      const viewedRows = await db
        .select({ storyId: communityStoryViews.storyId })
        .from(communityStoryViews)
        .where(
          and(
            eq(communityStoryViews.viewerId, args.viewerId),
            inArray(communityStoryViews.storyId, storyIds),
          ),
        );
      const viewedSet = new Set(viewedRows.map((r) => r.storyId));
      for (const ring of byAuthor.values()) {
        if (ring.isMe) {
          ring.hasUnseen = false;
          continue;
        }
        ring.hasUnseen = ring.stories.some((s) => !viewedSet.has(s.id));
      }
    }

    const rings = [...byAuthor.values()];
    rings.sort((a, b) => {
      if (a.isMe && !b.isMe) return -1;
      if (!a.isMe && b.isMe) return 1;
      const aT = a.stories[0]?.createdAt ?? "";
      const bT = b.stories[0]?.createdAt ?? "";
      return bT.localeCompare(aT);
    });

    return { rings };
  } catch (e) {
    if (isMissingTable(e)) return { rings: [] };
    throw e;
  }
}

export async function createCommunityStory(args: {
  authorId: string;
  type: "text" | "image" | "video";
  body?: string;
  mediaId?: string;
  bgColor?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const db = getDb();
    const since = new Date(Date.now() - STORY_TTL_MS);

    const [countRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(communityStories)
      .where(
        and(
          eq(communityStories.authorId, args.authorId),
          gt(communityStories.createdAt, since),
        ),
      );

    if (Number(countRow?.n ?? 0) >= MAX_STORIES_PER_DAY) {
      return { ok: false, error: "story_limit_reached" };
    }

    let mediaUrl: string | null = null;
    if (args.mediaId) {
      const [media] = await db
        .select({ publicUrl: communityMedia.publicUrl, ownerId: communityMedia.ownerId })
        .from(communityMedia)
        .where(eq(communityMedia.id, args.mediaId))
        .limit(1);
      if (!media || media.ownerId !== args.authorId) {
        return { ok: false, error: "invalid_media" };
      }
      mediaUrl = media.publicUrl;
    }

    if (args.type === "text" && !(args.body?.trim())) {
      return { ok: false, error: "body_required" };
    }
    if ((args.type === "image" || args.type === "video") && !mediaUrl) {
      return { ok: false, error: "media_required" };
    }

    const expiresAt = new Date(Date.now() + STORY_TTL_MS);
    const bgColor =
      args.type === "text" ? normalizeStoryTextBg(args.bgColor) : null;
    const [row] = await db
      .insert(communityStories)
      .values({
        authorId: args.authorId,
        storyType: args.type,
        body: args.body?.trim() ?? null,
        mediaId: args.mediaId ?? null,
        mediaUrl,
        bgColor,
        expiresAt,
      })
      .returning({ id: communityStories.id });

    if (!row) return { ok: false, error: "story_create_failed" };
    return { ok: true, id: row.id };
  } catch (e) {
    if (isMissingTable(e)) return { ok: false, error: "stories_unavailable" };
    throw e;
  }
}

export async function expireOldStories(): Promise<void> {
  try {
    const db = getDb();
    await db
      .update(communityStories)
      .set({ status: "expired" })
      .where(
        and(
          eq(communityStories.status, "active"),
          sql`${communityStories.expiresAt} <= now()`,
        ),
      );
  } catch (e) {
    if (isMissingTable(e)) return;
    throw e;
  }
}

export async function getActiveStoryAuthor(
  storyId: string,
): Promise<{ authorId: string } | null> {
  try {
    const db = getDb();
    const now = new Date();
    const [row] = await db
      .select({ authorId: communityStories.authorId })
      .from(communityStories)
      .where(
        and(
          eq(communityStories.id, storyId),
          eq(communityStories.status, "active"),
          gt(communityStories.expiresAt, now),
        ),
      )
      .limit(1);
    return row ? { authorId: row.authorId } : null;
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

export async function deleteCommunityStory(args: {
  storyId: string;
  authorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = getDb();
    const [row] = await db
      .update(communityStories)
      .set({ status: "deleted" })
      .where(
        and(
          eq(communityStories.id, args.storyId),
          eq(communityStories.authorId, args.authorId),
          eq(communityStories.status, "active"),
        ),
      )
      .returning({ id: communityStories.id });
    if (!row) return { ok: false, error: "story_not_found" };
    return { ok: true };
  } catch (e) {
    if (isMissingTable(e)) return { ok: false, error: "stories_unavailable" };
    throw e;
  }
}

export async function recordStoryView(
  storyId: string,
  viewerId: string,
): Promise<number> {
  try {
    const db = getDb();
    await db
      .insert(communityStoryViews)
      .values({ storyId, viewerId })
      .onConflictDoNothing();
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(communityStoryViews)
      .where(eq(communityStoryViews.storyId, storyId));
    return Number(row?.n ?? 0);
  } catch (e) {
    if (isMissingTable(e)) return 0;
    throw e;
  }
}

export async function getStoryEngagement(args: {
  storyId: string;
  viewerId: string | null;
}): Promise<StoryEngagement> {
  try {
    const db = getDb();
    const [viewRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(communityStoryViews)
      .where(eq(communityStoryViews.storyId, args.storyId));

    const reactionRows = await db
      .select({
        emoji: communityStoryReactions.emoji,
        n: sql<number>`count(*)::int`,
      })
      .from(communityStoryReactions)
      .where(eq(communityStoryReactions.storyId, args.storyId))
      .groupBy(communityStoryReactions.emoji);

    let myReaction: string | null = null;
    if (args.viewerId) {
      const [mine] = await db
        .select({ emoji: communityStoryReactions.emoji })
        .from(communityStoryReactions)
        .where(
          and(
            eq(communityStoryReactions.storyId, args.storyId),
            eq(communityStoryReactions.userId, args.viewerId),
          ),
        )
        .limit(1);
      myReaction = mine?.emoji ?? null;
    }

    return {
      viewCount: Number(viewRow?.n ?? 0),
      reactions: reactionRows.map((r) => ({
        emoji: r.emoji,
        count: Number(r.n ?? 0),
      })),
      myReaction,
    };
  } catch (e) {
    if (isMissingTable(e)) {
      return { viewCount: 0, reactions: [], myReaction: null };
    }
    throw e;
  }
}

export async function setStoryReaction(args: {
  storyId: string;
  userId: string;
  emoji: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !(STORY_REACTION_EMOJIS as readonly string[]).includes(args.emoji)
  ) {
    return { ok: false, error: "invalid_emoji" };
  }

  try {
    const db = getDb();
    const active = await getActiveStoryAuthor(args.storyId);
    if (!active) return { ok: false, error: "story_not_found" };

    await db
      .insert(communityStoryReactions)
      .values({
        storyId: args.storyId,
        userId: args.userId,
        emoji: args.emoji,
      })
      .onConflictDoUpdate({
        target: [
          communityStoryReactions.storyId,
          communityStoryReactions.userId,
        ],
        set: { emoji: args.emoji },
      });
    return { ok: true };
  } catch (e) {
    if (isMissingTable(e)) return { ok: false, error: "stories_unavailable" };
    throw e;
  }
}
