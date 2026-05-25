import type { Messages } from "@/i18n/messages";
import {
  parseGranularRoles,
  type GranularRoleId,
} from "@/lib/avec/governance/granular-roles";

/** Human-readable AVEC role (never show raw `co_admin` in UI). */
export function groupRoleLabel(
  t: (k: keyof Messages) => string,
  role: string,
): string {
  if (role === "admin") return t("group_settings_role_admin");
  if (role === "co_admin") return t("group_settings_role_coadmin");
  if (role === "committee") return t("group_settings_role_committee");
  if (role === "member") return t("group_settings_role_member");
  return role;
}

export function granularRoleLabel(
  t: (k: keyof Messages) => string,
  role: GranularRoleId,
): string {
  if (role === "treasurer") return t("group_granular_role_treasurer");
  if (role === "credit_officer") return t("group_granular_role_credit_officer");
  return t("group_granular_role_secretary");
}

export function memberRoleSummary(
  t: (k: keyof Messages) => string,
  args: { role: string; granularRoles?: unknown },
): string {
  const base = groupRoleLabel(t, args.role);
  const granular = parseGranularRoles(args.granularRoles);
  if (granular.length === 0) return base;
  return `${base} · ${granular.map((g) => granularRoleLabel(t, g)).join(", ")}`;
}
