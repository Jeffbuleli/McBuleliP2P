import type { UserRoleType } from "@/lib/roles";
import { UserRole } from "@/lib/roles";

/** Minimum role required to access each admin area (extend as you add modules). */
export const ADMIN_ROUTE_MIN_ROLE = {
  dashboard: UserRole.AGENT,
  withdrawals: UserRole.AGENT,
  groups: UserRole.AGENT,
  p2pDisputes: UserRole.AGENT,
  /** Staff roster + future HR-style settings */
  team: UserRole.SUPER_ADMIN,
  /** Change any user’s platform role */
  userRoles: UserRole.SUPER_ADMIN,
} as const satisfies Record<string, UserRoleType>;

const rank: Record<UserRoleType, number> = {
  [UserRole.USER]: 0,
  [UserRole.AGENT]: 1,
  [UserRole.SUPER_ADMIN]: 2,
};

export function adminRank(role: UserRoleType): number {
  return rank[role] ?? 0;
}

export function canAccessAdminRoute(
  viewerRole: UserRoleType,
  minRole: UserRoleType,
): boolean {
  return adminRank(viewerRole) >= adminRank(minRole);
}
