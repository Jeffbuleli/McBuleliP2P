import { NextResponse } from "next/server";
import { z } from "zod";
import {
  opsActorLabel,
  readOpsTokenFromCookie,
  readOpsTokenFromRequest,
  requireOpsAuth,
} from "@/lib/ops/auth";
import { notifySessionUpdated } from "@/lib/ops/notify";
import { roleHasPermission } from "@/lib/ops/roles";
import { sessionVisibleToRole } from "@/lib/ops/visibility";
import { applySlaEscalationIfNeeded } from "@/lib/ops/sla-engine";
import { slaUiState } from "@/lib/ops/sla";
import { resolveOpsContext } from "@/lib/partners/bind";
import {
  buildRoutingMeta,
  partnersForSessionDisplay,
} from "@/lib/partners/match";
import {
  sanitizeCitizenSession,
  sanitizeOpsSession,
  type RelatedAlertSummary,
} from "@/lib/sessions/sanitize";
import {
  getSession,
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
  const ctxAuth = resolveOpsContext(bearer || cookieToken);

  if (ctxAuth.role) {
    if (!roleHasPermission(ctxAuth.role, "alerts.view")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const live = applySlaEscalationIfNeeded(session);

    if (
      !sessionVisibleToRole(
        ctxAuth.role,
        live,
        ctxAuth.partner?.id ?? null,
      )
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

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

    const opsSession = sanitizeOpsSession(live);
    // IP / UA : investigation OPS interne uniquement (pas partenaires).
    const sessionForRole =
      ctxAuth.role === "partner"
        ? { ...opsSession, clientIp: null, userAgent: null, routingMeta }
        : { ...opsSession, routingMeta };

    return NextResponse.json({
      session: sessionForRole,
      relatedAlerts: ctxAuth.role === "partner" ? [] : relatedAlerts,
      relatedCount: ctxAuth.role === "partner" ? 0 : relatedAlerts.length,
      sla: slaUiState(live),
      role: ctxAuth.role,
      partner: ctxAuth.partner
        ? { id: ctxAuth.partner.id, name: ctxAuth.partner.name }
        : null,
      suggestedPartners,
    });
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

  if (
    !sessionVisibleToRole(auth.role, existing, auth.partner?.id ?? null)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  if (
    nextStatus === "closed" ||
    nextStatus === "cancelled"
  ) {
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

  void notifySessionUpdated(session);
  return NextResponse.json({ session: sanitizeOpsSession(session) });
}
