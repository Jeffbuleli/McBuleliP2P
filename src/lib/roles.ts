export const UserRole = {
  USER: "user",
  AGENT: "agent",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export function parseSuperAdminEmails(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSuperAdminEmail(email: string): boolean {
  return parseSuperAdminEmails().has(email.trim().toLowerCase());
}
