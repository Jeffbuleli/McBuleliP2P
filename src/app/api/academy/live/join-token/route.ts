import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { resolveGatedLiveJoinUrl } from "@/lib/academy-live-join";
import { resolveLiveSessionRecord } from "@/lib/academy-live-resolve";
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

  const row = await resolveLiveSessionRecord({
    editionSlug: parsed.data.editionSlug,
    programSlug: parsed.data.program,
    sessionSlug: parsed.data.sessionSlug,
  });

  if (!row) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  const db = getDb();
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
    sessionTitle: row.sessionTitle,
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
