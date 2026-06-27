import { NextResponse } from "next/server";
import { z } from "zod";
import { getLiveSessionStats } from "@/lib/academy-live-stats";
import { getSessionUser } from "@/lib/session-user";

const querySchema = z.object({
  editionSlug: z.string().trim().min(1).max(64),
  sessionSlug: z.string().trim().min(1).max(64),
  program: z.string().trim().max(64).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    editionSlug: url.searchParams.get("editionSlug"),
    sessionSlug: url.searchParams.get("sessionSlug"),
    program: url.searchParams.get("program") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const stats = await getLiveSessionStats({
    userId: user.id,
    editionSlug: parsed.data.editionSlug,
    sessionSlug: parsed.data.sessionSlug,
    programSlug: parsed.data.program,
  });

  if (!stats) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, stats });
}
