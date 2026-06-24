import { and, desc, eq, gt, sql } from "drizzle-orm";
import {
  communityMedia,
  communityStories,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { normalizeStoryTextBg } from "@/lib/community/story-text-colors";

export type CommunityStoryItem = {
  id: string;
  type: "text" | "image" | "video";
  body: string | null;
  mediaUrl: string | null;
  bgColor: string | null;
  createdAt: string;
  expiresAt: string;
};

export type CommunityStoryRing = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isMe: boolean;
  stories: CommunityStoryItem[];
};

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_STORIES_PER_DAY = 8;

function isMissingTable(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  return code === "42P01";
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

    for (const row of rows) {
      const handle = row.handle ?? row.authorId.slice(0, 8);
      const displayName = row.displayName ?? handle;
      let ring = byAuthor.get(row.authorId);
      if (!ring) {
        ring = {
          userId: row.authorId,
          handle,
          displayName,
          avatarUrl: row.avatarUrl ?? null,
          isMe: args.viewerId === row.authorId,
          stories: [],
        };
        byAuthor.set(row.authorId, ring);
      }
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
