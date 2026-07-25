import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hackathonJuryScores } from "@/db";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import {
  averageTeamScore,
  listJuryQueue,
  lockJuryScores,
  requireJuryAccess,
  upsertJuryScores,
} from "@/lib/hackathon/submissions";
import { JURY_CRITERIA } from "@/lib/hackathon/team-status";
import { TeamError } from "@/lib/hackathon/teams";
import { SessionError, requireUserId } from "@/lib/session";
import { requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

async function assertJuryOrAdmin(userId: string, editionId: string) {
  try {
    await requireSuperAdmin();
    return true;
  } catch {
    const person = await requireJuryAccess(userId, editionId);
    return Boolean(person);
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const ok = await assertJuryOrAdmin(userId, edition.id);
    if (!ok) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const queue = await listJuryQueue(edition.id);
    const db = getDb();
    const items = [];
    for (const row of queue) {
      const scores = await db
        .select()
        .from(hackathonJuryScores)
        .where(eq(hackathonJuryScores.submissionId, row.submission.id));
      const mine = scores.filter((s) => s.jurorUserId === userId);
      items.push({
        team: {
          id: row.team.id,
          name: row.team.name,
          status: row.team.status,
        },
        submission: {
          id: row.submission.id,
          demoUrl: row.submission.demoUrl,
          githubUrl: row.submission.githubUrl,
          figmaUrl: row.submission.figmaUrl,
          pitchPdfUrl: row.submission.pitchPdfUrl,
          readmeUrl: row.submission.readmeUrl,
          notes: row.submission.notes,
          submittedAt: row.submission.submittedAt?.toISOString() ?? null,
        },
        myScores: mine.map((s) => ({
          criterion: s.criterion,
          score: s.score,
          comment: s.comment,
          lockedAt: s.lockedAt?.toISOString() ?? null,
        })),
        myLocked: mine.length > 0 && mine.every((s) => s.lockedAt),
        average: averageTeamScore(scores),
      });
    }

    return NextResponse.json({
      criteria: JURY_CRITERIA,
      items,
    });
  } catch (e) {
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/jury GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const scoreSchema = z.object({
  action: z.enum(["save", "lock"]),
  submissionId: z.string().uuid(),
  scores: z
    .array(
      z.object({
        criterion: z.enum([
          "innovation",
          "impact",
          "technical",
          "business",
          "presentation",
        ]),
        score: z.number().int().min(0).max(10),
        comment: z.string().max(2000).optional(),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const ok = await assertJuryOrAdmin(userId, edition.id);
    if (!ok) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const json = await req.json().catch(() => null);
    const parsed = scoreSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (parsed.data.action === "save") {
      if (!parsed.data.scores?.length) {
        return NextResponse.json({ error: "scores_required" }, { status: 400 });
      }
      await upsertJuryScores({
        submissionId: parsed.data.submissionId,
        jurorUserId: userId,
        scores: parsed.data.scores,
      });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.scores?.length) {
      await upsertJuryScores({
        submissionId: parsed.data.submissionId,
        jurorUserId: userId,
        scores: parsed.data.scores,
      });
    }
    await lockJuryScores({
      submissionId: parsed.data.submissionId,
      jurorUserId: userId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof TeamError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/jury POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
