function pickString(
  detail: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = detail[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Normalize MetaMap SDK event detail (camelCase or snake_case). */
export function normalizeMetamapSdkDetail(
  detail: Record<string, unknown> | null | undefined,
): { identityId?: string; verificationId?: string } {
  if (!detail) return {};
  return {
    identityId: pickString(detail, "identityId", "identity_id", "identity"),
    verificationId: pickString(
      detail,
      "verificationId",
      "verification_id",
      "verification",
    ),
  };
}
