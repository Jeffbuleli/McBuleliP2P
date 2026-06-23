import { eq } from "drizzle-orm";
import {
  academyEditions,
  academyPrograms,
  academyTrainingEvents,
  communityPosts,
  getDb,
  type academyTrainingEvents as eventsTable,
} from "@/db";
import { communityEnabled } from "@/lib/community/config";
import {
  formationSummaryBody,
  type FormationPostMeta,
} from "@/lib/community/formation-post-meta";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import type { EventRecord } from "@/lib/events/types";

type EventRow = typeof eventsTable.$inferSelect;

type EditionContext = {
  editionSlug: string;
  programSlug: string;
  editionTitle: string;
};

async function resolveEditionContext(
  editionId: string | null,
): Promise<EditionContext | null> {
  if (!editionId) return null;
  const [row] = await getDb()
    .select({
      editionSlug: academyEditions.slug,
      programSlug: academyPrograms.slug,
      editionTitle: academyEditions.titleFr,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(eq(academyEditions.id, editionId))
    .limit(1);
  return row ?? null;
}

async function eventJoinPath(
  event: EventRow,
  edition: EditionContext | null,
): Promise<string> {
  if (edition) {
    const q = `?program=${encodeURIComponent(edition.programSlug)}`;
    return `/app/academy/${edition.editionSlug}/live/${event.slug}${q}`;
  }
  return `/app/academy`;
}

async function buildFormationMeta(
  event: EventRow,
  joinPath: string,
  edition: EditionContext | null,
): Promise<FormationPostMeta> {
  return {
    v: 1,
    eventId: event.id,
    eventSlug: event.slug,
    editionSlug: edition?.editionSlug ?? "",
    programSlug: edition?.programSlug ?? "",
    editionTitle: edition?.editionTitle,
    joinPath,
    trainerName: event.trainerName,
    startDate: event.startDate.toISOString(),
    timezone: event.timezone,
    title: event.title,
    description: event.description?.trim() || undefined,
    eventStatus: event.status,
  };
}

export async function syncEventCommunityPost(eventId: string): Promise<string | null> {
  if (!communityEnabled()) return null;

  const db = getDb();
  const [event] = await db
    .select()
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.id, eventId))
    .limit(1);
  if (!event || event.visibility === "PRIVATE") return null;
  if (!["PUBLISHED", "LIVE"].includes(event.status)) return null;

  await ensureCommunityProfile(event.trainerId);
  const edition = await resolveEditionContext(event.editionId);
  const joinPath = await eventJoinPath(event, edition);
  const meta = await buildFormationMeta(event, joinPath, edition);
  const body = formationSummaryBody(meta, true);
  const now = new Date();

  if (event.communityPostId) {
    const [existingPost] = await db
      .select({ status: communityPosts.status })
      .from(communityPosts)
      .where(eq(communityPosts.id, event.communityPostId))
      .limit(1);
    if (!existingPost || existingPost.status === "removed") {
      await db
        .update(academyTrainingEvents)
        .set({ communityPostId: null, updatedAt: now })
        .where(eq(academyTrainingEvents.id, eventId));
    } else {
      await db
        .update(communityPosts)
        .set({
          body,
          contentKind: "formation",
          meta,
          updatedAt: now,
          publishedAt: now,
          status: "published",
        })
        .where(eq(communityPosts.id, event.communityPostId));
      return event.communityPostId;
    }
  }

  const [post] = await db
    .insert(communityPosts)
    .values({
      authorId: event.trainerId,
      body,
      postType: "text",
      contentKind: "formation",
      meta,
      status: "published",
      publishedAt: now,
    })
    .returning({ id: communityPosts.id });

  if (!post) return null;

  await db
    .update(academyTrainingEvents)
    .set({ communityPostId: post.id, updatedAt: now })
    .where(eq(academyTrainingEvents.id, eventId));

  return post.id;
}

/** Retire le post Community lié à un événement (annulation / erreur). */
export async function removeEventCommunityPost(eventId: string): Promise<void> {
  if (!communityEnabled()) return;
  const db = getDb();
  const [event] = await db
    .select({ communityPostId: academyTrainingEvents.communityPostId })
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.id, eventId))
    .limit(1);
  if (!event?.communityPostId) return;
  await db
    .update(communityPosts)
    .set({ status: "removed", updatedAt: new Date() })
    .where(eq(communityPosts.id, event.communityPostId));
  await db
    .update(academyTrainingEvents)
    .set({ communityPostId: null, updatedAt: new Date() })
    .where(eq(academyTrainingEvents.id, eventId));
}

export async function removeCommunityPostsForEdition(editionId: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: academyTrainingEvents.id })
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.editionId, editionId));
  for (const r of rows) {
    await removeEventCommunityPost(r.id);
  }
}

export async function resolveEventJoinPath(row: EventRow): Promise<string> {
  const edition = await resolveEditionContext(row.editionId);
  return eventJoinPath(row, edition);
}

export function eventToPublic(
  row: EventRow,
  extra?: { participantCount?: number; joinPath?: string },
): EventRecord & {
  platformLabel: "McBuleli Live";
  joinPath: string;
  priceUsdt: number;
  participantCount?: number;
} {
  return {
    ...row,
    eventType: row.eventType as EventRecord["eventType"],
    visibility: row.visibility as EventRecord["visibility"],
    audienceMode: row.audienceMode as EventRecord["audienceMode"],
    status: row.status as EventRecord["status"],
    platformLabel: "McBuleli Live",
    joinPath: extra?.joinPath ?? `/app/events/${row.slug}`,
    priceUsdt: Number(row.price),
    participantCount: extra?.participantCount,
  };
}
