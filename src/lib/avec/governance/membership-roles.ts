import type { GroupMembershipRole } from "@/lib/group-savings-types";
import {
  parseGranularRoles,
  type GranularRoleId,
} from "@/lib/avec/governance/granular-roles";

export type MembershipLike = {
  role: string;
  status: string;
  granularRoles?: unknown;
};

export function hasRole(
  m: { role: string; status: string } | null,
  roles: GroupMembershipRole[],
): boolean {
  if (!m) return false;
  if (m.status !== "approved") return false;
  return (roles as string[]).includes(m.role);
}

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
