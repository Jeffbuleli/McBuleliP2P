import { NextResponse } from "next/server";
import { z } from "zod";
import {
  OPS_COOKIE,
  OPS_ROLE_COOKIE,
  opsActorLabel,
  opsCookieOptions,
  opsCookieSecureFromRequest,
  readOpsSession,
} from "@/lib/ops/auth";
import { resolveOpsActor } from "@/lib/access/bridge";
import { OPS_ROLE_LABELS } from "@/lib/ops/roles";
import { resolveOpsContext } from "@/lib/partners/bind";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  token: z.string().min(8).max(256),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`ops-login:${ip}`, 8, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const token = parsed.data.token.trim().replace(/\s+/g, "");
  const ctx = resolveOpsContext(token);
  if (!ctx.role) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const actor = resolveOpsActor(token);
  const secure = opsCookieSecureFromRequest(req);
  const res = NextResponse.json({
    ok: true,
    role: ctx.role,
    roleLabel: OPS_ROLE_LABELS[ctx.role],
    partner: ctx.partner
      ? { id: ctx.partner.id, name: ctx.partner.name, slug: ctx.partner.slug }
      : null,
    actor: opsActorLabel(token),
    access: actor
      ? {
          id: actor.id,
          organizationId: actor.organizationId,
          scopes: actor.accreditation.scopes,
          level: actor.accreditation.level,
          status: actor.accreditation.status,
        }
      : null,
  });
  res.cookies.set(OPS_COOKIE, token, opsCookieOptions(secure));
  res.cookies.set(OPS_ROLE_COOKIE, ctx.role, opsCookieOptions(secure));
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true });
  const secure = opsCookieSecureFromRequest(req);
  const expired = { ...opsCookieOptions(secure), maxAge: 0 };
  res.cookies.set(OPS_COOKIE, "", expired);
  res.cookies.set(OPS_ROLE_COOKIE, "", expired);
  return res;
}

export async function GET(req: Request) {
  const { role, partner, actor, token } = await readOpsSession();
  if (!role || !token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const secure = opsCookieSecureFromRequest(req);
  const res = NextResponse.json({
    role,
    roleLabel: OPS_ROLE_LABELS[role],
    partner: partner
      ? { id: partner.id, name: partner.name, slug: partner.slug }
      : null,
    access: actor
      ? {
          id: actor.id,
          organizationId: actor.organizationId,
          scopes: actor.accreditation.scopes,
          level: actor.accreditation.level,
          status: actor.accreditation.status,
        }
      : null,
  });
  // Sliding refresh aussi via GET /api/ops/auth
  res.cookies.set(OPS_COOKIE, token, opsCookieOptions(secure));
  res.cookies.set(OPS_ROLE_COOKIE, role, opsCookieOptions(secure));
  return res;
}
