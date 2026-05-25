import type { Messages } from "@/i18n/messages";

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
