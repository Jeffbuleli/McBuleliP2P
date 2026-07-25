import { and, eq } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonJuryScores,
  hackathonPeople,
  hackathonSubmissions,
  hackathonTeams,
} from "@/db";
import {
  JURY_CRITERIA,
  computeWeightedScore,
  type JuryCriterionId,
} from "@/lib/hackathon/team-status";
import { markTeamJudged, markTeamSubmitted, TeamError } from "@/lib/hackathon/teams";

export async function getOrCreateSubmission(teamId: string, editionId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(hackathonSubmissions)
    .where(eq(hackathonSubmissions.teamId, teamId))
    .limit(1);
  if (existing) return existing;
  const [row] = await db
    .insert(hackathonSubmissions)
    .values({ teamId, editionId, status: "draft" })
    .returning();
  return row;
}

export async function updateSubmissionDraft(opts: {
  teamId: string;
  editionId: string;
  patch: {
    demoUrl?: string | null;
    githubUrl?: string | null;
    figmaUrl?: string | null;
    pitchPdfUrl?: string | null;
    readmeUrl?: string | null;
    notes?: string | null;
  };
}) {
  const db = getDb();
  const [edition] = await db
    .select({ submissionDeadlineAt: hackathonEditions.submissionDeadlineAt })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, opts.editionId))
    .limit(1);

  const sub = await getOrCreateSubmission(opts.teamId, opts.editionId);
  if (sub.status === "submitted") {
    if (
      edition?.submissionDeadlineAt &&
      edition.submissionDeadlineAt.getTime() <= Date.now()
    ) {
      throw new TeamError("deadline_passed", 403);
    }
  }

  const [updated] = await db
    .update(hackathonSubmissions)
    .set({
      ...opts.patch,
      updatedAt: new Date(),
    })
    .where(eq(hackathonSubmissions.id, sub.id))
    .returning();
  return updated;
}

export async function submitDeliverables(opts: {
  teamId: string;
  editionId: string;
}) {
  const db = getDb();
  const [edition] = await db
    .select({ submissionDeadlineAt: hackathonEditions.submissionDeadlineAt })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, opts.editionId))
    .limit(1);
  if (
    edition?.submissionDeadlineAt &&
    edition.submissionDeadlineAt.getTime() <= Date.now()
  ) {
    throw new TeamError("deadline_passed", 403);
  }

  const sub = await getOrCreateSubmission(opts.teamId, opts.editionId);
  const [updated] = await db
    .update(hackathonSubmissions)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(hackathonSubmissions.id, sub.id))
    .returning();
  await markTeamSubmitted(opts.teamId);
  return updated;
}

export async function requireJuryAccess(userId: string, editionId: string) {
  const db = getDb();
  const [person] = await db
    .select()
    .from(hackathonPeople)
    .where(
      and(
        eq(hackathonPeople.editionId, editionId),
        eq(hackathonPeople.userId, userId),
        eq(hackathonPeople.role, "jury"),
      ),
    )
    .limit(1);
  return person ?? null;
}

export async function upsertJuryScores(opts: {
  submissionId: string;
  jurorUserId: string;
  scores: Array<{ criterion: JuryCriterionId; score: number; comment?: string }>;
}) {
  const db = getDb();
  const existing = await db
    .select()
    .from(hackathonJuryScores)
    .where(
      and(
        eq(hackathonJuryScores.submissionId, opts.submissionId),
        eq(hackathonJuryScores.jurorUserId, opts.jurorUserId),
      ),
    );
  if (existing.some((s) => s.lockedAt)) {
    throw new TeamError("scores_locked", 403);
  }

  for (const row of opts.scores) {
    if (!JURY_CRITERIA.some((c) => c.id === row.criterion)) {
      throw new TeamError("invalid_criterion", 400);
    }
    if (row.score < 0 || row.score > 10) {
      throw new TeamError("invalid_score", 400);
    }
    const hit = existing.find((e) => e.criterion === row.criterion);
    if (hit) {
      await db
        .update(hackathonJuryScores)
        .set({
          score: row.score,
          comment: row.comment ?? null,
          updatedAt: new Date(),
        })
        .where(eq(hackathonJuryScores.id, hit.id));
    } else {
      await db.insert(hackathonJuryScores).values({
        submissionId: opts.submissionId,
        jurorUserId: opts.jurorUserId,
        criterion: row.criterion,
        score: row.score,
        comment: row.comment ?? null,
      });
    }
  }
}

export async function lockJuryScores(opts: {
  submissionId: string;
  jurorUserId: string;
}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathonJuryScores)
    .where(
      and(
        eq(hackathonJuryScores.submissionId, opts.submissionId),
        eq(hackathonJuryScores.jurorUserId, opts.jurorUserId),
      ),
    );
  const map: Partial<Record<JuryCriterionId, number>> = {};
  for (const r of rows) {
    map[r.criterion as JuryCriterionId] = r.score;
  }
  if (computeWeightedScore(map) === null) {
    throw new TeamError("incomplete_scores", 400);
  }
  const now = new Date();
  await db
    .update(hackathonJuryScores)
    .set({ lockedAt: now, updatedAt: now })
    .where(
      and(
        eq(hackathonJuryScores.submissionId, opts.submissionId),
        eq(hackathonJuryScores.jurorUserId, opts.jurorUserId),
      ),
    );

  // If all published jurors have locked, mark team judged.
  const [sub] = await db
    .select()
    .from(hackathonSubmissions)
    .where(eq(hackathonSubmissions.id, opts.submissionId))
    .limit(1);
  if (!sub) return;

  const jurors = await db
    .select({ userId: hackathonPeople.userId })
    .from(hackathonPeople)
    .where(
      and(
        eq(hackathonPeople.editionId, sub.editionId),
        eq(hackathonPeople.role, "jury"),
      ),
    );
  const linked = jurors.map((j) => j.userId).filter(Boolean) as string[];
  if (!linked.length) return;

  let allLocked = true;
  for (const uid of linked) {
    const scores = await db
      .select()
      .from(hackathonJuryScores)
      .where(
        and(
          eq(hackathonJuryScores.submissionId, opts.submissionId),
          eq(hackathonJuryScores.jurorUserId, uid),
        ),
      );
    if (!scores.length || scores.some((s) => !s.lockedAt)) {
      allLocked = false;
      break;
    }
  }
  if (allLocked) {
    await markTeamJudged(sub.teamId);
  }
}

export function averageTeamScore(
  allScores: Array<{ criterion: string; score: number; jurorUserId: string }>,
): number | null {
  const byJuror = new Map<string, Partial<Record<JuryCriterionId, number>>>();
  for (const s of allScores) {
    const m = byJuror.get(s.jurorUserId) ?? {};
    m[s.criterion as JuryCriterionId] = s.score;
    byJuror.set(s.jurorUserId, m);
  }
  const totals: number[] = [];
  for (const m of byJuror.values()) {
    const t = computeWeightedScore(m);
    if (t !== null) totals.push(t);
  }
  if (!totals.length) return null;
  return Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10;
}

export async function listJuryQueue(editionId: string) {
  const db = getDb();
  const rows = await db
    .select({
      submission: hackathonSubmissions,
      team: hackathonTeams,
    })
    .from(hackathonSubmissions)
    .innerJoin(
      hackathonTeams,
      eq(hackathonSubmissions.teamId, hackathonTeams.id),
    )
    .where(
      and(
        eq(hackathonSubmissions.editionId, editionId),
        eq(hackathonSubmissions.status, "submitted"),
      ),
    );
  return rows;
}
