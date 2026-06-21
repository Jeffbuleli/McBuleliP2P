import { eq } from "drizzle-orm";
import {
  academyEditions,
  academyTrainingEvents,
  communityPosts,
  getDb,
  type academyTrainingEvents as eventsTable,
} from "@/db";
import { communityEnabled } from "@/lib/community/config";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import type { EventRecord } from "@/lib/events/types";

type EventRow = typeof eventsTable.$inferSelect;

async function eventJoinPath(event: EventRow): Promise<string> {
  if (event.editionId) {
    const [ed] = await getDb()
      .select({ slug: academyEditions.slug })
      .from(academyEditions)
      .where(eq(academyEditions.id, event.editionId))
      .limit(1);
    if (ed) return `/app/academy/${ed.slug}/event/${event.slug}`;
  }
  return `/app/academy`;
}

function formatCommunityBody(event: EventRow, joinPath: string): string {
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(event.startDate);

  return [
    "Annonce · Formation",
    "",
    event.title,
    date,
    `Formateur : ${event.trainerName}`,
    "",
    "Plateforme : McBuleli Live",
    "",
    `Participer : ${joinPath}`,
  ].join("\n");
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
  const joinPath = await eventJoinPath(event);
  const body = formatCommunityBody(event, joinPath);
  const now = new Date();

  if (event.communityPostId) {
    await db
      .update(communityPosts)
      .set({ body, updatedAt: now, publishedAt: now, status: "published" })
      .where(eq(communityPosts.id, event.communityPostId));
    return event.communityPostId;
  }

  const [post] = await db
    .insert(communityPosts)
    .values({
      authorId: event.trainerId,
      body,
      postType: "text",
      contentKind: "news",
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

export function eventToPublic(
  row: EventRow,
  extra?: { participantCount?: number },
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
    joinPath: `/app/events/${row.slug}`,
    priceUsdt: Number(row.price),
    participantCount: extra?.participantCount,
  };
}
