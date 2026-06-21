import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { publishEvent } from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const out = await publishEvent({ idOrSlug: id, userId: me.id, appRole: me.role });
  if (!out.ok) {
    const status = out.code === "event_forbidden" ? 403 : 400;
    return NextResponse.json({ error: out.code }, { status });
  }
  return NextResponse.json({
    ok: true,
    event: out.event,
    autoEnrolled: out.autoEnrolled,
    communityPostId: out.communityPostId,
  });
}
