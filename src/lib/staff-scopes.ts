import type { UserRoleType } from "@/lib/roles";
import { UserRole } from "@/lib/roles";

/** Operational modules an agent may be granted (super-admin always has all). */
export const STAFF_SCOPES = [
  "withdrawals",
  "groups",
  "p2p_disputes",
  /** Create / edit drafts / submit platform OPEX requests. */
  "platform_expenses",
  /** Approve, reject, mark paid (cannot approve own submissions unless super-admin). */
  "platform_expenses_approve",
  /** Home page landing promo banners (images, links, copy). */
  "landing_ads",
  /** Hackathon door QR scan (entry / exit). */
  "hackathon_scan",
  /** Hackathon read-only stats / registration lists. */
  "hackathon_stats",
] as const;
export type StaffScope = (typeof STAFF_SCOPES)[number];

export function isStaffScope(s: string): s is StaffScope {
  return (STAFF_SCOPES as readonly string[]).includes(s);
}

/** Parse JSONB value when it is a non-null array (column NULL handled by caller). */
export function normalizeStaffScopesJson(raw: unknown): StaffScope[] {
  if (!Array.isArray(raw)) return [];
  const out: StaffScope[] = [];
  for (const x of raw) {
    if (typeof x === "string" && isStaffScope(x)) out.push(x);
  }
  return out;
}

/**
 * `staffScopes === null` on an agent means legacy “full ops” (all scopes).
 * Empty array means explicitly no module access.
 */
export function agentHasScope(
  u: { role: UserRoleType; staffScopes: StaffScope[] | null },
  scope: StaffScope,
): boolean {
  if (u.role === UserRole.SUPER_ADMIN) return true;
  if (u.role !== UserRole.AGENT) return false;
  if (u.staffScopes === null) return true;
  return u.staffScopes.includes(scope);
}

export function agentHasAnyStaffScope(u: {
  role: UserRoleType;
  staffScopes: StaffScope[] | null;
}): boolean {
  if (u.role === UserRole.SUPER_ADMIN) return true;
  if (u.role !== UserRole.AGENT) return false;
  if (u.staffScopes === null) return true;
  return u.staffScopes.length > 0;
}
