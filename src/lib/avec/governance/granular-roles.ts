/** Functional roles assigned via collective vote (base role stays member/committee/…). */
export const GRANULAR_ROLE_IDS = ["treasurer", "credit_officer", "secretary"] as const;

export type GranularRoleId = (typeof GRANULAR_ROLE_IDS)[number];

export function parseGranularRoles(raw: unknown): GranularRoleId[] {
  if (!Array.isArray(raw)) return [];
  const out: GranularRoleId[] = [];
  for (const r of raw) {
    if (typeof r !== "string") continue;
    const id = r.trim() as GranularRoleId;
    if (GRANULAR_ROLE_IDS.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function normalizeGranularAssignments(
  assignments: unknown,
): { userId: string; granularRoles: GranularRoleId[] }[] {
  if (!Array.isArray(assignments)) return [];
  const out: { userId: string; granularRoles: GranularRoleId[] }[] = [];
  for (const row of assignments) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const userId = typeof o.userId === "string" ? o.userId.trim() : "";
    if (!userId) continue;
    out.push({
      userId,
      granularRoles: parseGranularRoles(o.granularRoles),
    });
  }
  return out;
}
