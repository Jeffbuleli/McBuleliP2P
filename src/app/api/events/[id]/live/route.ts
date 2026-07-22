import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getEventLiveUrlForUser } from "@/lib/events/events-service";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const modeRaw = url.searchParams.get("mode");
  const mode =
    modeRaw === "host" || modeRaw === "audio" ? modeRaw : "learner";

  const [profile] = await getDb()
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);

  const displayName =
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0] ||
    me.email.split("@")[0] ||
    "McBuleli";

  const out = await getEventLiveUrlForUser({
    idOrSlug: id,
    userId: me.id,
    displayName,
    appRole: me.role,
    mode,
  });
  if (!out.ok) return NextResponse.json({ error: out.code }, { status: 403 });
  return NextResponse.json({ ok: true, platform: out.platform, url: out.url });
}
