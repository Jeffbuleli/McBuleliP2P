import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decidePermission } from "@/lib/access/abac";
import { resolveOpsActor } from "@/lib/access/bridge";
import type { OpsActor } from "@/lib/access/types";
import {
  OPS_COOKIE,
  OPS_ROLE_COOKIE,
  opsAuthConfigured,
  opsTokenForRole,
  resolveOpsRole,
} from "@/lib/ops/auth-tokens";
import {
  OPS_ROLE_LABELS,
  type OpsPermission,
  type OpsRole,
  roleHasPermission,
} from "@/lib/ops/roles";
import { resolveOpsContext } from "@/lib/partners/bind";
import type { PartnerOrg } from "@/lib/partners/types";

export {
  OPS_COOKIE,
  OPS_ROLE_COOKIE,
  opsAuthConfigured,
  resolveOpsRole,
};

export function readOpsTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export async function readOpsSession(): Promise<{
  token: string | null;
  role: OpsRole | null;
  partner: PartnerOrg | null;
  actor: OpsActor | null;
}> {
  const jar = await cookies();
  const token = jar.get(OPS_COOKIE)?.value ?? null;
  const roleCookie = jar.get(OPS_ROLE_COOKIE)?.value;
  const ctx = resolveOpsContext(token);
  const roleFromToken = ctx.role;
  const role =
    roleFromToken &&
    roleCookie &&
    roleFromToken === (roleCookie as OpsRole)
      ? roleFromToken
      : roleFromToken;
  const actor = resolveOpsActor(token);
  return { token, role: role ?? null, partner: ctx.partner, actor };
}

export function opsCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    // Partagé sur tout le site (citoyen + ops) - path /ops casserait /api/ops/*
    path: "/",
    // 14 jours - renouvelé (sliding) à chaque visite /ops
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function opsCookieSecureFromRequest(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const xfProto = req.headers.get("x-forwarded-proto");
  if (xfProto === "https") return true;
  return req.url.startsWith("https://");
}

/**
 * Label humain pour chat / chronologie (pas de hash technique type mcbuleli-7d1428).
 * Ex. "McBuleli NGEMBA (national) · Administrateur"
 */
export function formatOpsActorLabel(actor: OpsActor): string {
  const roleLabel = OPS_ROLE_LABELS[actor.role];
  const org =
    actor.partner?.name?.trim() ||
    actor.organizationName?.trim() ||
    actor.displayName?.trim() ||
    null;
  if (org && org !== roleLabel) return `${org} · ${roleLabel}`;
  return roleLabel;
}

export function opsActorLabel(token: string): string {
  const actor = resolveOpsActor(token);
  if (actor) return formatOpsActorLabel(actor);
  const ctx = resolveOpsContext(token);
  if (!ctx.role) return "Opérateur";
  const roleLabel = OPS_ROLE_LABELS[ctx.role];
  if (ctx.partner?.name) return `${ctx.partner.name} · ${roleLabel}`;
  return roleLabel;
}

export type OpsAuthOk = {
  role: OpsRole;
  partner: PartnerOrg | null;
  token: string;
  actor: OpsActor;
};

export async function requireOpsAuth(
  req: Request,
  opts?: { permission?: OpsPermission; roles?: OpsRole[] },
): Promise<NextResponse | OpsAuthOk> {
  if (!opsAuthConfigured()) {
    return NextResponse.json(
      { error: "ops_auth_not_configured" },
      { status: 503 },
    );
  }

  const bearer = readOpsTokenFromRequest(req);
  const jar = await cookies();
  const cookieToken = jar.get(OPS_COOKIE)?.value ?? null;
  const token = bearer || cookieToken;
  const actor = resolveOpsActor(token);
  const role = actor?.role ?? null;

  if (!role || !token || !actor) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (opts?.roles?.length && !opts.roles.includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (opts?.permission) {
    const decision = decidePermission(actor, opts.permission);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: "forbidden", reason: decision.reason },
        { status: 403 },
      );
    }
  }

  return { role, partner: actor.partner, token, actor };
}

export function verifyOpsToken(value: string | null | undefined): boolean {
  return resolveOpsActor(value) !== null;
}

export function getOpsToken(): string | null {
  return opsTokenForRole("admin");
}

export function opsTokenConfigured(): boolean {
  return opsAuthConfigured();
}

export async function readOpsTokenFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(OPS_COOKIE)?.value ?? null;
}

export function isOpsAuthed(req: Request, cookieToken?: string | null): boolean {
  const bearer = readOpsTokenFromRequest(req);
  return (
    resolveOpsActor(bearer) !== null || resolveOpsActor(cookieToken) !== null
  );
}

/** Compat: encore utilise roleHasPermission cote client legacy. */
export { roleHasPermission };
