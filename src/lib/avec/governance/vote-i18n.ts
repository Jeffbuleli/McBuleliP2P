import type { ProposalType } from "@/lib/avec/governance/types";
import type { GranularRoleId } from "@/lib/avec/governance/granular-roles";

export function proposalTypeI18nKey(type: ProposalType): string {
  return `group_gov_type_${type}`;
}

export function granularRoleI18nKey(role: GranularRoleId): string {
  return `group_gov_granular_${role}`;
}

export function membershipRoleI18nKey(role: string): string {
  if (role === "admin") return "group_gov_role_admin";
  if (role === "co_admin") return "group_gov_role_co_admin";
  if (role === "committee") return "group_gov_role_committee";
  if (role === "revoked") return "group_gov_role_revoked";
  return "group_gov_role_member";
}
