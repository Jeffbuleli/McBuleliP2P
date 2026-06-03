import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listCohortMessages,
  postCohortMessage,
  resolveEditionIdBySlug,
} from "@/lib/academy-cohort-messaging";
import { getSessionUser } from "@/lib/session-user";
import { getSessionUserId } from "@/lib/session";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { editionSlug } = await ctx.params;
  const programSlug =
    new URL(req.url).searchParams.get("program")?.trim() || undefined;
  const editionId = await resolveEditionIdBySlug({ editionSlug, programSlug });
  if (!editionId) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  const result = await listCohortMessages({
    editionId,
    userId,
    limit: 50,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ messages: result.messages });
}

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  programSlug: z.string().max(64).optional(),
  messageType: z.enum(["chat", "announcement"]).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { editionSlug } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const editionId = await resolveEditionIdBySlug({
    editionSlug,
    programSlug: parsed.data.programSlug,
  });
  if (!editionId) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  const sessionUser = await getSessionUser();
  const isStaff = sessionUser?.role === UserRole.SUPER_ADMIN;

  const result = await postCohortMessage({
    editionId,
    userId,
    body: parsed.data.body,
    messageType: parsed.data.messageType,
    isStaff,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
