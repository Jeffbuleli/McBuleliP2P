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
import { resolveOpsContext } from "@/lib/partners/bind";
import {
  buildRoutingMeta,
  partnersForSessionDisplay,
} from "@/lib/partners/match";
import { getSession, updateSession } from "@/lib/sessions/store";

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
    if (
      !sessionVisibleToRole(
        ctxAuth.role,
        session,
        ctxAuth.partner?.id ?? null,
      )
    ) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const routingMeta =
      session.routingMeta ??
      buildRoutingMeta({
        commune: session.commune,
        locationLabel: session.locationLabel,
        category: session.category,
      });
    const suggestedPartners = partnersForSessionDisplay({
      ...session,
      routingMeta,
    }).map((p) => ({
      id: p.id,
      name: p.name,
      contactHint: p.contactHint ?? null,
      nationalFallback: p.nationalFallback,
    }));

    return NextResponse.json({
      session: { ...session, routingMeta },
      role: ctxAuth.role,
      partner: ctxAuth.partner
        ? { id: ctxAuth.partner.id, name: ctxAuth.partner.name }
        : null,
      suggestedPartners,
    });
  }

  const { trustedContacts: _hidden, routingMeta: _rm, ...publicSession } =
    session;
  return NextResponse.json({
    session: {
      ...publicSession,
      trustedContacts: [],
      routingMeta: null,
    },
  });
}

const patchBody = z.object({
  status: z
    .enum(["opened", "active", "oriented", "closed", "cancelled"])
    .optional(),
  assignedTo: z.string().trim().min(1).max(120).nullable().optional(),
  operatorNotes: z.string().trim().max(4000).nullable().optional(),
  actorLabel: z.string().trim().min(1).max(120).optional(),
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

  const actor = parsed.data.actorLabel || opsActorLabel(auth.token);

  const session = updateSession(
    id,
    {
      status: parsed.data.status,
      assignedTo: parsed.data.assignedTo,
      operatorNotes: parsed.data.operatorNotes,
    },
    {
      actor,
      note:
        parsed.data.status === "oriented"
          ? "Prise en charge"
          : parsed.data.status === "closed"
            ? "Dossier cloture"
            : undefined,
    },
  );
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  void notifySessionUpdated(session);
  return NextResponse.json({ session });
}
