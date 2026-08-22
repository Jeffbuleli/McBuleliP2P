import { desc, eq } from "drizzle-orm";
import {
  getDb,
  hackathonMentorRequests,
  hackathonTeams,
} from "@/db";

export type MentorQueueRow = {
  id: string;
  topic: string;
  notes: string | null;
  status: string;
  teamId: string;
  teamName: string;
  createdAt: string;
};

export async function listMentorQueue(
  editionId: string,
): Promise<MentorQueueRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathonMentorRequests.id,
      topic: hackathonMentorRequests.topic,
      notes: hackathonMentorRequests.notes,
      status: hackathonMentorRequests.status,
      teamId: hackathonMentorRequests.teamId,
      teamName: hackathonTeams.name,
      createdAt: hackathonMentorRequests.createdAt,
    })
    .from(hackathonMentorRequests)
    .innerJoin(hackathonTeams, eq(hackathonMentorRequests.teamId, hackathonTeams.id))
    .where(eq(hackathonMentorRequests.editionId, editionId))
    .orderBy(desc(hackathonMentorRequests.createdAt));

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function updateMentorRequestStatus(
  id: string,
  status: "open" | "accepted" | "closed",
): Promise<boolean> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(hackathonMentorRequests)
    .set({
      status,
      acceptedAt: status === "accepted" ? now : undefined,
      closedAt: status === "closed" ? now : undefined,
      updatedAt: now,
    })
    .where(eq(hackathonMentorRequests.id, id))
    .returning({ id: hackathonMentorRequests.id });
  return Boolean(row);
}
