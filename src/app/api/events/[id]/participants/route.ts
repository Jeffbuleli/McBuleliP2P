import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import {
  canEditEvent,
  resolveEventRole,
} from "@/lib/events/permissions";
import {
  getEventByIdOrSlug,
  listEventParticipants,
} from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const event = await getEventByIdOrSlug(id);
  if (!event) return NextResponse.json({ error: "event_not_found" }, { status: 404 });

  const role = resolveEventRole({ userId: me.id, appRole: me.role, event });
  if (!canEditEvent({ role, userId: me.id, event })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const participants = await listEventParticipants(event.id);
  return NextResponse.json({ ok: true, participants });
}
