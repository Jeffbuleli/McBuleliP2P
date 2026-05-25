import type { GroupMembershipRole } from "@/lib/group-savings-types";
import { hasRole } from "@/lib/group-savings-permissions";
import {
  parseGranularRoles,
  type GranularRoleId,
} from "@/lib/avec/governance/granular-roles";

export type MembershipLike = {
  role: string;
  status: string;
  granularRoles?: unknown;
};

export function membershipGranularRoles(m: MembershipLike | null): GranularRoleId[] {
  if (!m || m.status !== "approved") return [];
  return parseGranularRoles(m.granularRoles);
}

export function hasGranularRole(
  m: MembershipLike | null,
  role: GranularRoleId,
): boolean {
  return membershipGranularRoles(m).includes(role);
}

export function isGroupManager(m: MembershipLike | null): boolean {
  return hasRole(m, ["admin", "co_admin"]);
}

/** Propose / initiate internal loans (governance or legacy pending). */
export function canProposeGroupLoan(m: MembershipLike | null): boolean {
  if (!m || m.status !== "approved") return false;
  if (isGroupManager(m)) return true;
  if (hasRole(m, ["committee"])) return true;
  return hasGranularRole(m, "credit_officer");
}

/** 2/3 manager approvals, loan reject, manager repay on behalf. */
export function canManageGroupLoans(m: MembershipLike | null): boolean {
  return isGroupManager(m);
}

/** Propose collective payouts (tier B/C). */
export function canProposeGroupPayout(m: MembershipLike | null): boolean {
  if (!m || m.status !== "approved") return false;
  if (isGroupManager(m)) return true;
  if (hasRole(m, ["committee"])) return true;
  return hasGranularRole(m, "treasurer");
}

/** Group settings / RH proposals (co-admins, committee, granular roles). */
export function canProposeGovernancePolicy(m: MembershipLike | null): boolean {
  return hasRole(m, ["admin"]);
}
