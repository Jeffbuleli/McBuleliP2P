import { eq } from "drizzle-orm";
import {
  academyTrainingEvents,
  communityPosts,
  getDb,
  type academyTrainingEvents as eventsTable,
} from "@/db";
import { communityEnabled } from "@/lib/community/config";
import { ensureCommunityProfile } from "@/lib/community/profile-service";
import type { EventRecord } from "@/lib/events/types";

type EventRow = typeof eventsTable.$inferSelect;

function formatCommunityBody(event: EventRow): string {
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(event.startDate);

  return [
    "📢 Nouvelle Formation",
    "",
    event.title,
    date,
    `Formateur : ${event.trainerName}`,
    "",
    "Plateforme : McBuleli Live",
    "",
    `👉 Participer : /app/events/${event.slug}`,
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
  const body = formatCommunityBody(event);
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
