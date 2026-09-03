import type { PartnerOrg } from "@/lib/partners/types";
import type { OpsRole } from "@/lib/ops/roles";
import { resolveOpsRole } from "@/lib/ops/auth-tokens";
import { listPartners } from "@/lib/partners/directory";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Si le token correspond a tokenEnv d'un partenaire, le lier a cet org. */
export function resolveBoundPartner(
  token: string | null | undefined,
): PartnerOrg | null {
  if (!token) return null;
  for (const p of listPartners()) {
    if (!p.tokenEnv) continue;
    const expected = process.env[p.tokenEnv]?.trim() || "";
    if (expected && safeEqual(token, expected)) return p;
  }
  return null;
}

export function resolveOpsContext(token: string | null | undefined): {
  role: OpsRole | null;
  partner: PartnerOrg | null;
} {
  const partner = resolveBoundPartner(token);
  if (partner) {
    const role = partner.opsRoles[0] ?? null;
    return { role, partner };
  }
  return { role: resolveOpsRole(token), partner: null };
}
