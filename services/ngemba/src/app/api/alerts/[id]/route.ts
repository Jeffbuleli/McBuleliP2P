import { NextResponse } from "next/server";
import { z } from "zod";
import {
  decideIncidentAccess,
  hashIp,
  logAccess,
  resolveOpsActor,
} from "@/lib/access";
import { buildReferrals } from "@/lib/directory/referral";
import { getReferrals, saveReferrals } from "@/lib/directory/store";
import {
  opsActorLabel,
  readOpsTokenFromCookie,
  readOpsTokenFromRequest,
  requireOpsAuth,
} from "@/lib/ops/auth";
import { matchUnitsForIncident } from "@/lib/units/match";
import { notifySessionUpdated } from "@/lib/ops/notify";
import { roleHasPermission } from "@/lib/ops/roles";
import { applySlaEscalationIfNeeded } from "@/lib/ops/sla-engine";
import { slaUiState } from "@/lib/ops/sla";
import {
  buildRoutingMeta,
  partnersForSessionDisplay,
} from "@/lib/partners/match";
import { clientIp } from "@/lib/security/rate-limit";
import {
  sanitizeCitizenSession,
  sanitizeOpsSessionForActor,
  type RelatedAlertSummary,
} from "@/lib/sessions/sanitize";
import {
  getSession,
  listIncidentEvents,
  listSessionsByCitizen,
  updateSession,
} from "@/lib/sessions/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const bearer = readOpsTokenFromRequest(req);
  const cookieToken = await readOpsTokenFromCookie();
  const actor = resolveOpsActor(bearer || cookieToken);

  if (actor && roleHasPermission(actor.role, "alerts.view")) {
    const live = applySlaEscalationIfNeeded(session);
    const decision = decideIncidentAccess(actor, live, "operational");
    logAccess({
      actor,
      resourceType: "alert_session",
      resourceId: id,
      action: "view",
      scope: "operational",
      allowed: decision.allowed,
      reason: decision.reason,
      ipHash: hashIp(clientIp(req)),
    });

    // Cookie OPS présent mais hors périmètre : ne pas bloquer la vue citoyenne
    // (souvent le cas sur mobile après un login ops dans le même navigateur).
    if (decision.allowed) {
      const routingMeta =
        live.routingMeta ??
        buildRoutingMeta({
          commune: live.commune,
          locationLabel: live.locationLabel,
          category: live.category,
        });
      const suggestedPartners = partnersForSessionDisplay({
        ...live,
        routingMeta,
      }).map((p) => ({
        id: p.id,
        name: p.name,
        contactHint: p.contactHint ?? null,
        nationalFallback: p.nationalFallback,
      }));

      const relatedAlerts: RelatedAlertSummary[] = live.citizenToken
        ? listSessionsByCitizen(live.citizenToken, 10)
            .filter((s) => s.id !== live.id)
            .map((s) => ({
              id: s.id,
              status: s.status,
              urgency: s.urgency,
              createdAt: s.createdAt,
              source: s.source,
            }))
        : [];

      const opsSession = sanitizeOpsSessionForActor(
        { ...live, routingMeta },
        actor,
      );

      const events = await listIncidentEvents(id, 100);

      let referrals = getReferrals(id);
      if (!referrals) {
        const built = buildReferrals({
          requiredServices: live.aiPayload?.required_services ?? [],
          commune: live.commune,
          locationLabel: live.locationLabel,
          category: live.category,
        });
        referrals = saveReferrals({
          sessionId: id,
          matches: built.matches,
          unmatched: built.unmatched,
        });
      }

      return NextResponse.json({
        session: opsSession,
        relatedAlerts: actor.role === "partner" ? [] : relatedAlerts,
        relatedCount: actor.role === "partner" ? 0 : relatedAlerts.length,
        sla: slaUiState(live),
        role: actor.role,
        actor: {
          id: actor.id,
          organizationId: actor.organizationId,
          scopes: actor.accreditation.scopes,
          level: actor.accreditation.level,
        },
        partner: actor.partner
          ? { id: actor.partner.id, name: actor.partner.name }
          : null,
        suggestedPartners,
        referrals: {
          requiredServices: live.aiPayload?.required_services ?? [],
          matches: referrals.matches,
          unmatched: referrals.unmatched,
        },
        unitMatches: matchUnitsForIncident({
          requiredServices: live.aiPayload?.required_services ?? [],
          commune: live.commune,
          locationLabel: live.locationLabel,
          lat: live.lat,
          lng: live.lng,
        }).map((m) => ({
          id: m.unit.id,
          name: m.unit.name,
          unitType: m.unit.unitType,
          status: m.unit.status,
          organizationName: m.unit.organizationName,
          locationLabel: m.unit.locationLabel,
          capabilities: m.unit.capabilities,
          score: m.score,
          reason: m.reason,
          matchedCapabilities: m.matchedCapabilities,
          etaMinutes: m.unit.etaMinutes,
        })),
        events,
      });
    }
  }

  return NextResponse.json({
    session: sanitizeCitizenSession(session),
  });
}

const patchBody = z.object({
  status: z
    .enum(["opened", "active", "oriented", "closed", "cancelled"])
    .optional(),
  assignedTo: z.string().trim().min(1).max(120).nullable().optional(),
  operatorNotes: z.string().trim().max(4000).nullable().optional(),
  actorLabel: z.string().trim().min(1).max(120).optional(),
  historyNote: z.string().trim().min(1).max(400).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireOpsAuth(req, { permission: "alerts.patch" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const existing = getSession(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const decision = decideIncidentAccess(auth.actor, existing, "operational");
  if (!decision.allowed) {
    logAccess({
      actor: auth.actor,
      resourceType: "alert_session",
      resourceId: id,
      action: "patch",
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const nextStatus = parsed.data.status;
  const mergedNotes =
    parsed.data.operatorNotes !== undefined
      ? parsed.data.operatorNotes
      : existing.operatorNotes;

  if (nextStatus === "closed" || nextStatus === "cancelled") {
    if (!mergedNotes || mergedNotes.trim().length < 3) {
      return NextResponse.json(
        { error: "close_note_required" },
        { status: 400 },
      );
    }
  }

  const actor = parsed.data.actorLabel || opsActorLabel(auth.token);

  const defaultNote =
    nextStatus === "oriented"
      ? "Prise en charge"
      : nextStatus === "closed"
        ? "Dossier clôturé"
        : nextStatus === "cancelled"
          ? "Alerte annulée / fausse alerte"
          : nextStatus === "active"
            ? "Dossier rouvert"
            : undefined;

  const session = updateSession(
    id,
    {
      status: parsed.data.status,
      assignedTo: parsed.data.assignedTo,
      operatorNotes: parsed.data.operatorNotes,
    },
    {
      actor,
      note: parsed.data.historyNote || defaultNote,
    },
  );
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  logAccess({
    actor: auth.actor,
    resourceType: "alert_session",
    resourceId: id,
    action: "patch",
    scope: "operational",
    allowed: true,
    reason: "ok",
    ipHash: hashIp(clientIp(req)),
    meta: { status: session.status },
  });

  void notifySessionUpdated(session);
  return NextResponse.json({
    session: sanitizeOpsSessionForActor(session, auth.actor),
  });
}
