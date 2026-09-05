import { NextResponse } from "next/server";
import { decideIncidentAccess, hashIp, logAccess } from "@/lib/access";
import { requireOpsAuth } from "@/lib/ops/auth";
import { sessionVisibleToActor } from "@/lib/ops/visibility";
import { clientIp } from "@/lib/security/rate-limit";
import { getSession, listIncidentEvents } from "@/lib/sessions/store";

type Ctx = { params: Promise<{ id: string }> };

/** Timeline immutable (incident_events) - ops only. */
export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireOpsAuth(req, { permission: "alerts.view" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const decision = decideIncidentAccess(auth.actor, session, "operational");
  if (!decision.allowed) {
    logAccess({
      actor: auth.actor,
      resourceType: "alert_session",
      resourceId: id,
      action: "view_events",
      scope: "operational",
      allowed: false,
      reason: decision.reason,
      ipHash: hashIp(clientIp(req)),
    });
    return NextResponse.json(
      { error: "forbidden", reason: decision.reason },
      { status: 403 },
    );
  }

  const events = await listIncidentEvents(id, 200);
  return NextResponse.json({
    sessionId: id,
    count: events.length,
    events,
  });
}
