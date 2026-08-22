import { and, desc, eq } from "drizzle-orm";
import {
  getDb,
  hackathonAnnouncements,
  hackathonMentorRequests,
  hackathonRegistrations,
  hackathonTeams,
} from "@/db";
import { hackathonProgramDays } from "@/lib/hackathon/event-content";
import { buildAwardsLeaderboard } from "@/lib/hackathon/awards";
import { getPitchQueue, toPitchQueuePublic } from "@/lib/hackathon/pitch-queue";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { getLivePresentationPayload } from "@/lib/hackathon/slides/session";
import {
  TEAM_STATUS_LABELS_EN,
  TEAM_STATUS_LABELS_FR,
  type TeamStatus,
} from "@/lib/hackathon/team-status";
import { getMcSession, toMcPublic } from "@/lib/hackathon/mc-state";

function currentProgramSlot(now = new Date()) {
  const days = hackathonProgramDays();
  const day = days[0];
  if (!day) return null;

  const hhmm = `${String(now.getHours()).padStart(2, "0")}h${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  let current = day.slots[0] ?? null;
  for (const slot of day.slots) {
    const startTime = slot.time.split(" - ")[0]?.trim() ?? "";
    if (startTime <= hhmm) current = slot;
  }
  return {
    dayIndex: 1,
    labelFr: day.labelFr,
    labelEn: day.labelEn,
    slot: current,
  };
}

export async function buildLivePayload() {
  const edition = await getFeaturedEditionRow();
  if (!edition) return { error: "no_edition" as const };

  const db = getDb();

  const regs = await db
    .select({
      presenceStatus: hackathonRegistrations.presenceStatus,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        eq(hackathonRegistrations.paymentStatus, "paid"),
      ),
    );

  const inside = regs.filter((r) => r.presenceStatus === "inside").length;
  const outside = regs.filter((r) => r.presenceStatus === "outside").length;
  const absent = regs.filter((r) => r.presenceStatus === "absent").length;

  const teams = await db
    .select({
      id: hackathonTeams.id,
      name: hackathonTeams.name,
      status: hackathonTeams.status,
    })
    .from(hackathonTeams)
    .where(eq(hackathonTeams.editionId, edition.id))
    .orderBy(desc(hackathonTeams.updatedAt))
    .limit(100);

  const mentoring = await db
    .select({
      id: hackathonMentorRequests.id,
      topic: hackathonMentorRequests.topic,
      teamId: hackathonMentorRequests.teamId,
      teamName: hackathonTeams.name,
    })
    .from(hackathonMentorRequests)
    .innerJoin(
      hackathonTeams,
      eq(hackathonMentorRequests.teamId, hackathonTeams.id),
    )
    .where(
      and(
        eq(hackathonMentorRequests.editionId, edition.id),
        eq(hackathonMentorRequests.status, "accepted"),
      ),
    )
    .limit(20);

  const [pinned] = await db
    .select()
    .from(hackathonAnnouncements)
    .where(
      and(
        eq(hackathonAnnouncements.editionId, edition.id),
        eq(hackathonAnnouncements.pinned, true),
      ),
    )
    .orderBy(desc(hackathonAnnouncements.publishedAt))
    .limit(1);

  const [latest] = await db
    .select()
    .from(hackathonAnnouncements)
    .where(eq(hackathonAnnouncements.editionId, edition.id))
    .orderBy(desc(hackathonAnnouncements.publishedAt))
    .limit(1);

  const announcement = pinned ?? latest ?? null;

  let presentation = null;
  try {
    presentation = await getLivePresentationPayload();
  } catch {
    presentation = null;
  }

  const mc = toMcPublic(getMcSession());
  const awards = await buildAwardsLeaderboard(edition.id);
  const pitchQueue = toPitchQueuePublic(getPitchQueue());

  return {
    edition: {
      id: edition.id,
      nameFr: edition.nameFr,
      nameEn: edition.nameEn,
      submissionDeadlineAt: edition.submissionDeadlineAt?.toISOString() ?? null,
      challengeLockAt: edition.challengeLockAt?.toISOString() ?? null,
    },
    presence: { inside, outside, absent, paid: regs.length },
    program: currentProgramSlot(),
    announcement: announcement
      ? {
          id: announcement.id,
          title: announcement.title,
          body: announcement.body,
          pinned: announcement.pinned,
          publishedAt: announcement.publishedAt.toISOString(),
        }
      : null,
    mentoring,
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status as TeamStatus,
      labelFr: TEAM_STATUS_LABELS_FR[t.status as TeamStatus] ?? t.status,
      labelEn: TEAM_STATUS_LABELS_EN[t.status as TeamStatus] ?? t.status,
    })),
    presentation,
    projectorMode: mc.projectorMode,
    mc,
    awards,
    pitchQueue,
    serverTime: new Date().toISOString(),
  };
}
