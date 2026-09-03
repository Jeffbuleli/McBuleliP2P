export type TrustedContact = {
  name: string;
  phone?: string | null;
  email?: string | null;
  /** Quartier / adresse libre (aide dossier ops) */
  address?: string | null;
  /** Mere, ami, voisin... */
  relation?: string | null;
};

export const MAX_TRUSTED_CONTACTS = 3;

/** Digits only, for wa.me / tel links. */
export function phoneDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

/**
 * Normalise un numero RDC vers E.164 sans + (ex. 243812345678).
 * Accepte 081..., 81..., +243..., 00243...
 */
export function normalizeRdcPhoneE164(
  phone: string | null | undefined,
): string | null {
  const digits = phoneDigits(phone);
  if (!digits) return null;

  if (digits.startsWith("243") && digits.length >= 12) {
    return digits.slice(0, 15);
  }
  if (digits.startsWith("0") && digits.length >= 9) {
    return `243${digits.slice(1)}`.slice(0, 15);
  }
  if (digits.length === 9 && /^[1-9]/.test(digits)) {
    return `243${digits}`;
  }
  // deja international autre pays : garder tel quel si assez long
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

export function waMeUrl(phone: string | null | undefined): string | null {
  const e164 = normalizeRdcPhoneE164(phone);
  if (!e164) return null;
  return `https://wa.me/${e164}`;
}

export function telUrl(phone: string | null | undefined): string | null {
  const e164 = normalizeRdcPhoneE164(phone);
  if (!e164) return null;
  return `tel:+${e164}`;
}

export function mailtoUrl(email: string | null | undefined): string | null {
  const e = email?.trim();
  if (!e || !e.includes("@")) return null;
  return `mailto:${e}`;
}

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
    const address =
      typeof row.address === "string" ? row.address.trim() : undefined;
    const relation =
      typeof row.relation === "string" ? row.relation.trim() : undefined;
    if (name.length < 2) continue;
    if (!phone && !email) continue;
    out.push({
      name: name.slice(0, 80),
      phone: phone?.slice(0, 24) ?? null,
      email: email?.slice(0, 120) ?? null,
      address: address?.slice(0, 160) || null,
      relation: relation?.slice(0, 60) || null,
    });
  }
  return out.length ? out : null;
}
