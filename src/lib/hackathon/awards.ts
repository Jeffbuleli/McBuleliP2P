import { eq } from "drizzle-orm";
import {
  getDb,
  hackathonJuryScores,
  hackathonSubmissions,
  hackathonTeams,
} from "@/db";
import { averageTeamScore } from "@/lib/hackathon/submissions";

export type AwardsEntry = {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  jurorCount: number;
};

export type AwardsPayload = {
  entries: AwardsEntry[];
  /** Teams with at least one juror score row */
  scoredTeamCount: number;
  updatedAt: string;
};

/** Top-N teams by aggregated jury score (for Live projector Awards mode). */
export async function buildAwardsLeaderboard(
  editionId: string,
  limit = 3,
): Promise<AwardsPayload> {
  const db = getDb();
  const rows = await db
    .select({
      teamId: hackathonTeams.id,
      teamName: hackathonTeams.name,
      submissionId: hackathonSubmissions.id,
    })
    .from(hackathonSubmissions)
    .innerJoin(hackathonTeams, eq(hackathonSubmissions.teamId, hackathonTeams.id))
    .where(eq(hackathonSubmissions.editionId, editionId));

  const ranked: Omit<AwardsEntry, "rank">[] = [];

  for (const row of rows) {
    const scores = await db
      .select({
        criterion: hackathonJuryScores.criterion,
        score: hackathonJuryScores.score,
        jurorUserId: hackathonJuryScores.jurorUserId,
      })
      .from(hackathonJuryScores)
      .where(eq(hackathonJuryScores.submissionId, row.submissionId));

    if (!scores.length) continue;

    const avg = averageTeamScore(scores);
    if (avg === null) continue;

    ranked.push({
      teamId: row.teamId,
      teamName: row.teamName,
      score: avg,
      jurorCount: new Set(scores.map((s) => s.jurorUserId)).size,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const entries = ranked.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    ...r,
  }));

  return {
    entries,
    scoredTeamCount: ranked.length,
    updatedAt: new Date().toISOString(),
  };
}
