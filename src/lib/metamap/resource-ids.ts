export function verificationIdFromResource(
  resource: string | undefined,
): string | null {
  if (!resource || typeof resource !== "string") return null;
  const parts = resource.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

export function parseMetamapResourceIds(resource: string | undefined): {
  identityId: string | null;
  verificationId: string | null;
} {
  if (!resource || typeof resource !== "string") {
    return { identityId: null, verificationId: null };
  }
  const parts = resource.split("/").filter(Boolean);
  const verificationId = parts[parts.length - 1] ?? null;
  const identityIdx = parts.indexOf("identity");
  const identityId =
    identityIdx >= 0 && parts[identityIdx + 1]
      ? (parts[identityIdx + 1] ?? null)
      : null;
  return { identityId, verificationId };
}
