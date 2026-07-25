import { NextResponse } from "next/server";
import { z } from "zod";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { SessionError, requireUserId } from "@/lib/session";
import {
  submitDeliverables,
  updateSubmissionDraft,
} from "@/lib/hackathon/submissions";
import {
  getMemberForRegistration,
  getRegistrationForUser,
  TeamError,
} from "@/lib/hackathon/teams";

export const dynamic = "force-dynamic";

const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional();

const patchSchema = z.object({
  action: z.enum(["save", "submit"]),
  demoUrl: optionalUrl,
  githubUrl: optionalUrl,
  figmaUrl: optionalUrl,
  pitchPdfUrl: optionalUrl,
  readmeUrl: optionalUrl,
  notes: z.string().max(5000).nullable().optional(),
});

function normUrl(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return v;
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const reg = await getRegistrationForUser(userId, edition.id);
    if (!reg || reg.paymentStatus !== "paid") {
      return NextResponse.json({ error: "payment_required" }, { status: 403 });
    }
    const membership = await getMemberForRegistration(reg.id);
    if (!membership) {
      return NextResponse.json({ error: "no_team" }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (parsed.data.action === "save") {
      const sub = await updateSubmissionDraft({
        teamId: membership.team.id,
        editionId: edition.id,
        patch: {
          demoUrl: normUrl(parsed.data.demoUrl),
          githubUrl: normUrl(parsed.data.githubUrl),
          figmaUrl: normUrl(parsed.data.figmaUrl),
          pitchPdfUrl: normUrl(parsed.data.pitchPdfUrl),
          readmeUrl: normUrl(parsed.data.readmeUrl),
          notes: parsed.data.notes ?? undefined,
        },
      });
      return NextResponse.json({ ok: true, submission: sub });
    }

    await updateSubmissionDraft({
      teamId: membership.team.id,
      editionId: edition.id,
      patch: {
        demoUrl: normUrl(parsed.data.demoUrl),
        githubUrl: normUrl(parsed.data.githubUrl),
        figmaUrl: normUrl(parsed.data.figmaUrl),
        pitchPdfUrl: normUrl(parsed.data.pitchPdfUrl),
        readmeUrl: normUrl(parsed.data.readmeUrl),
        notes: parsed.data.notes ?? undefined,
      },
    });
    const sub = await submitDeliverables({
      teamId: membership.team.id,
      editionId: edition.id,
    });
    return NextResponse.json({ ok: true, submission: sub });
  } catch (e) {
    if (e instanceof TeamError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/submissions]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
