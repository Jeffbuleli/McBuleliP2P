import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import {
  academyEditions,
  academyPrograms,
  academySessions,
  getDb,
  users,
} from "@/db";
import { resolveGatedLiveJoinUrl } from "@/lib/academy-live-join";
import { getSessionUser } from "@/lib/session-user";
import type { LiveJoinMode } from "@/lib/academy-live";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";

const querySchema = z.object({
  editionSlug: z.string().trim().min(1).max(64),
  sessionSlug: z.string().trim().min(1).max(64),
  program: z.string().trim().max(64).optional(),
  mode: z.enum(["learner", "host", "audio"]).default("learner"),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceApiRateLimit("jitsi_join", user.id, req);
  if (limited) return limited;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    editionSlug: url.searchParams.get("editionSlug"),
    sessionSlug:
      url.searchParams.get("sessionSlug") ??
      url.searchParams.get("room") ??
      undefined,
    program: url.searchParams.get("program") ?? undefined,
    mode: url.searchParams.get("mode") ?? "learner",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .select({
      editionId: academyEditions.id,
      editionSlug: academyEditions.slug,
      liveBaseUrl: academyEditions.liveBaseUrl,
      programSlug: academyPrograms.slug,
      sessionSlug: academySessions.slug,
      sessionLiveUrl: academySessions.liveUrl,
      sessionTitleFr: academySessions.titleFr,
    })
    .from(academySessions)
    .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      parsed.data.program
        ? and(
            eq(academyEditions.slug, parsed.data.editionSlug),
            eq(academyPrograms.slug, parsed.data.program),
            eq(academySessions.slug, parsed.data.sessionSlug),
          )
        : and(
            eq(academyEditions.slug, parsed.data.editionSlug),
            eq(academySessions.slug, parsed.data.sessionSlug),
          ),
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  const [profile] = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const displayName =
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email.split("@")[0] ||
    "McBuleli";

  const out = await resolveGatedLiveJoinUrl({
    userId: user.id,
    displayName,
    editionId: row.editionId,
    editionSlug: row.editionSlug,
    sessionSlug: row.sessionSlug,
    sessionLiveUrl: row.sessionLiveUrl,
    liveBaseUrl: row.liveBaseUrl,
    sessionTitle: row.sessionTitleFr,
    mode: parsed.data.mode as LiveJoinMode,
    appRole: user.role,
    req,
  });

  if (!out.ok) {
    return NextResponse.json({ error: out.code }, { status: 403 });
  }

  const room =
    out.url.split("#")[0].split("?")[0].replace(/\/$/, "").split("/").pop() ??
    parsed.data.sessionSlug;

  return NextResponse.json({
    ok: true,
    url: out.url,
    room,
    jwtEnabled: Boolean(process.env.JITSI_JWT_SECRET?.trim()),
    jwtAppId: process.env.JITSI_APP_ID?.trim() || "mcbuleli_live",
    jwtSub:
      process.env.JITSI_JWT_SUB?.trim() ||
      process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
      "live.mcbuleli.org",
  });
}
