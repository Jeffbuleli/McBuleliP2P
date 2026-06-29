/**
 * DRC mobile money - FreshPay method identifiers & MSISDN prefix map.
 */
export type MobileProviderOption = { provider: string; label: string; method: string };

export const COD_MOBILE_FALLBACK: MobileProviderOption[] = [
  { provider: "airtel", label: "Airtel Money", method: "airtel" },
  { provider: "orange", label: "Orange Money", method: "orange" },
  { provider: "mpesa", label: "M-Pesa", method: "mpesa" },
  { provider: "africell", label: "Afrimoney", method: "africell" },
];

/** Official DRC prefixes - longest match first (without leading 0). */
export const COD_MOBILE_PREFIX_MAP: { prefix: string; method: string }[] = [
  // Vodacom M-Pesa
  { prefix: "81", method: "mpesa" },
  { prefix: "82", method: "mpesa" },
  { prefix: "83", method: "mpesa" },
  { prefix: "86", method: "mpesa" },
  // Orange Money
  { prefix: "80", method: "orange" },
  { prefix: "84", method: "orange" },
  { prefix: "85", method: "orange" },
  { prefix: "89", method: "orange" },
  // Airtel Money
  { prefix: "97", method: "airtel" },
  { prefix: "98", method: "airtel" },
  { prefix: "99", method: "airtel" },
  // Africell
  { prefix: "90", method: "africell" },
  { prefix: "91", method: "africell" },
].sort((a, b) => b.prefix.length - a.prefix.length);

const MTN_COD_RE = /^MTN/i;

export function isExcludedCodMobileProvider(provider: string): boolean {
  const u = provider.trim().toUpperCase();
  return MTN_COD_RE.test(u) || u.includes("MTN_MOMO");
}

export function filterCodMobileProviders<T extends { provider: string }>(opts: T[]): T[] {
  return opts.filter((o) => !isExcludedCodMobileProvider(o.provider));
}

/** Map legacy PawaPay-style IDs or UI values to FreshPay `method`. */
export function toFreshpayMethod(provider: string): string {
  const u = provider.trim().toUpperCase();
  if (u === "AIRTEL" || u.includes("AIRTEL")) return "airtel";
  if (u === "ORANGE" || u.includes("ORANGE")) return "orange";
  if (u.includes("MPESA") || u.includes("VODACOM")) return "mpesa";
  if (u.includes("AFRICELL") || u.includes("AFRIMONEY")) return "africell";
  return provider.trim().toLowerCase();
}

function normalizeLocalMsisdn(input: string): string {
  let s = (input ?? "").trim().replace(/[()\s.-]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  while (s.startsWith("0")) s = s.slice(1);
  return s.startsWith("243") ? s.slice(3) : s;
}

/** Infer DRC mobile network from MSISDN (243XXXXXXXXX or 0XXXXXXXXX). */
export function detectCodMobileMethodFromPhone(input: string): string | null {
  const local = normalizeLocalMsisdn(input);
  if (local.length < 2) return null;
  for (const row of COD_MOBILE_PREFIX_MAP) {
    if (local.startsWith(row.prefix)) return row.method;
  }
  return null;
}

/** FreshPay rejects when `method` ≠ phone network - prefer detected network. */
export function resolveFreshpayMethod(
  phone: string,
  selectedProvider: string,
): { method: string; detected: string | null; matched: boolean } {
  const detected = detectCodMobileMethodFromPhone(phone);
  const selected = toFreshpayMethod(selectedProvider);
  if (detected) {
    return { method: detected, detected, matched: detected === selected };
  }
  return { method: selected, detected: null, matched: true };
}

export function freshpayMethodLabel(method: string, locale: "en" | "fr" = "en"): string {
  const m = toFreshpayMethod(method);
  const labels: Record<string, { en: string; fr: string }> = {
    airtel: { en: "Airtel", fr: "Airtel" },
    orange: { en: "Orange", fr: "Orange" },
    mpesa: { en: "M-Pesa", fr: "M-Pesa" },
    africell: { en: "Afrimoney", fr: "Afrimoney" },
    card: { en: "Visa", fr: "Visa" },
  };
  return labels[m]?.[locale] ?? method;
}
