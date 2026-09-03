import { NextResponse } from "next/server";
import { z } from "zod";
import {
  opsActorLabel,
  readOpsTokenFromCookie,
  readOpsTokenFromRequest,
  requireOpsAuth,
  resolveOpsRole,
} from "@/lib/ops/auth";
import { notifySessionUpdated } from "@/lib/ops/notify";
import { roleHasPermission } from "@/lib/ops/roles";
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
  const role = resolveOpsRole(bearer || cookieToken);
  if (role) {
    if (!roleHasPermission(role, "alerts.view")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    // Ops : dossier complet (proches inclus pour actions manuelles)
    return NextResponse.json({ session, role });
  }

  // Citoyen / public : jamais exposer les proches de confiance
  const { trustedContacts: _hidden, ...publicSession } = session;
  return NextResponse.json({
    session: { ...publicSession, trustedContacts: [] },
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

  const cookieToken = await readOpsTokenFromCookie();
  const bearer = readOpsTokenFromRequest(req);
  const token = bearer || cookieToken;
  const actor =
    parsed.data.actorLabel ||
    (token && resolveOpsRole(token) ? opsActorLabel(token) : "ops");

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
