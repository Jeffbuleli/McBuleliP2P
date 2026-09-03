export type TrustedContact = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

export const MAX_TRUSTED_CONTACTS = 3;

export function normalizeTrustedContacts(
  raw: unknown,
): TrustedContact[] | null {
  if (!Array.isArray(raw)) return null;
  const out: TrustedContact[] = [];
  for (const item of raw.slice(0, MAX_TRUSTED_CONTACTS)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const phone =
      typeof row.phone === "string" ? row.phone.trim() : undefined;
    const email =
      typeof row.email === "string" ? row.email.trim() : undefined;
    if (name.length < 2) continue;
    if (!phone && !email) continue;
    out.push({
      name: name.slice(0, 80),
      phone: phone?.slice(0, 24) ?? null,
      email: email?.slice(0, 120) ?? null,
    });
  }
  return out.length ? out : null;
}
