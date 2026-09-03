import type { OpsRole } from "@/lib/ops/roles";

export const OPS_COOKIE = "ngemba_ops";
export const OPS_ROLE_COOKIE = "ngemba_ops_role";

/** Edge-safe - process.env only (middleware). */
export function opsTokenForRole(role: OpsRole): string | null {
  const map: Record<OpsRole, string> = {
    admin:
      process.env.NGEMBA_OPS_TOKEN_ADMIN?.trim() ||
      process.env.NGEMBA_OPS_TOKEN?.trim() ||
      "",
    ngo: process.env.NGEMBA_OPS_TOKEN_NGO?.trim() || "",
    security: process.env.NGEMBA_OPS_TOKEN_SECURITY?.trim() || "",
    partner: process.env.NGEMBA_OPS_TOKEN_PARTNER?.trim() || "",
    school: process.env.NGEMBA_OPS_TOKEN_SCHOOL?.trim() || "",
  };
  const t = map[role];
  return t || null;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function resolveOpsRole(
  token: string | null | undefined,
): OpsRole | null {
  if (!token) return null;
  const roles: OpsRole[] = ["admin", "ngo", "security", "partner", "school"];
  for (const role of roles) {
    const expected = opsTokenForRole(role);
    if (expected && safeEqual(token, expected)) return role;
  }
  return null;
}

export function opsAuthConfigured(): boolean {
  return Boolean(opsTokenForRole("admin"));
}
