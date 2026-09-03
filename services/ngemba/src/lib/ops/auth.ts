import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readEnvKey } from "@/lib/env";
import {
  OPS_COOKIE,
  OPS_ROLE_COOKIE,
  opsAuthConfigured,
  opsTokenForRole,
  resolveOpsRole,
} from "@/lib/ops/auth-tokens";
import {
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
  return { token, role: role ?? null, partner: ctx.partner };
}

export function opsCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export function opsActorLabel(token: string): string {
  const ctx = resolveOpsContext(token);
  const role = ctx.role;
  if (!role) return "ops";
  const prefix = ctx.partner?.slug ?? role;
  const secret =
    opsTokenForRole(role) ||
    readEnvKey("NGEMBA_OPS_TOKEN") ||
    process.env.NGEMBA_OPS_TOKEN ||
    "ngemba";
  const hash = createHmac("sha256", secret)
    .update(token)
    .digest("hex")
    .slice(0, 6);
  return `${prefix}-${hash}`;
}

export async function requireOpsAuth(
  req: Request,
  opts?: { permission?: OpsPermission; roles?: OpsRole[] },
): Promise<
  NextResponse | { role: OpsRole; partner: PartnerOrg | null; token: string }
> {
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
  const ctx = resolveOpsContext(token);
  const role = ctx.role;

  if (!role || !token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const roleCookie = jar.get(OPS_ROLE_COOKIE)?.value;
  if (cookieToken && roleCookie && roleCookie !== role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (opts?.roles?.length && !opts.roles.includes(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (opts?.permission && !roleHasPermission(role, opts.permission)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return { role, partner: ctx.partner, token };
}

export function verifyOpsToken(value: string | null | undefined): boolean {
  return resolveOpsContext(value).role !== null;
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
    resolveOpsContext(bearer).role !== null ||
    resolveOpsContext(cookieToken).role !== null
  );
}
