import { NextResponse } from "next/server";
import { z } from "zod";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import {
  listMentorQueue,
  updateMentorRequestStatus,
} from "@/lib/hackathon/mentor-queue";
import { resolvePartnerChatAccess } from "@/lib/hackathon/partner-chat-auth";

export const dynamic = "force-dynamic";

async function requireMentorQueueAccess(editionId: string) {
  const access = await resolvePartnerChatAccess(editionId);
  if (!access.ok) {
    return { ok: false as const, status: access.status, error: access.error };
  }
  return { ok: true as const, session: access.session };
}

export async function GET() {
  try {
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }

    const auth = await requireMentorQueueAccess(edition.id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const requests = await listMentorQueue(edition.id);
    return NextResponse.json({
      ok: true,
      editionId: edition.id,
      staff: auth.session.staff,
      requests,
    });
  } catch (e) {
    console.error("[hackathon/mentor-queue GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "accepted", "closed"]),
});

export async function PATCH(req: Request) {
  try {
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }

    const auth = await requireMentorQueueAccess(edition.id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const ok = await updateMentorRequestStatus(
      parsed.data.id,
      parsed.data.status,
    );
    if (!ok) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const requests = await listMentorQueue(edition.id);
    return NextResponse.json({ ok: true, requests });
  } catch (e) {
    console.error("[hackathon/mentor-queue PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
