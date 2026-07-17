/**
 * DRC mobile money — PawaPay providers (Airtel, Orange, M-Pesa) + MSISDN prefix map.
 */
export type MobileProviderOption = { provider: string; label: string; method: string };

/** Wallet MoMo (PawaPay) — RDC only: Airtel, Orange, M-Pesa. */
export const COD_MOBILE_FALLBACK: MobileProviderOption[] = [
  { provider: "airtel", label: "Airtel Money", method: "AIRTEL_COD" },
  { provider: "orange", label: "Orange Money", method: "ORANGE_COD" },
  { provider: "mpesa", label: "M-Pesa", method: "VODACOM_MPESA_COD" },
];

/** Official DRC prefixes — longest match first (without leading 0). */
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
].sort((a, b) => b.prefix.length - a.prefix.length);

const MTN_COD_RE = /^MTN/i;
const AFRICELL_RE = /AFRICELL|AFRIMONEY/i;

/** Networks not offered on the PawaPay wallet rail. */
export function isExcludedCodMobileProvider(provider: string): boolean {
  const u = provider.trim().toUpperCase();
  return MTN_COD_RE.test(u) || u.includes("MTN_MOMO") || AFRICELL_RE.test(u);
}

export function filterCodMobileProviders<T extends { provider: string }>(opts: T[]): T[] {
  return opts.filter((o) => !isExcludedCodMobileProvider(o.provider));
}

/** Normalize UI / legacy values to short method key (airtel|orange|mpesa). */
export function toFreshpayMethod(provider: string): string {
  const u = provider.trim().toUpperCase();
  if (u === "AIRTEL" || u.includes("AIRTEL")) return "airtel";
  if (u === "ORANGE" || u.includes("ORANGE")) return "orange";
  if (u.includes("MPESA") || u.includes("VODACOM")) return "mpesa";
  if (u.includes("AFRICELL") || u.includes("AFRIMONEY")) return "africell";
  return provider.trim().toLowerCase();
}

/** Map short method / UI value to PawaPay provider id. */
export function toPawapayProviderId(provider: string): string {
  const m = toFreshpayMethod(provider);
  if (m === "airtel") return "AIRTEL_COD";
  if (m === "orange") return "ORANGE_COD";
  if (m === "mpesa") return "VODACOM_MPESA_COD";
  const u = provider.trim().toUpperCase();
  if (u === "AIRTEL_COD" || u === "ORANGE_COD" || u === "VODACOM_MPESA_COD") return u;
  return provider.trim();
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

/**
 * Prefer MSISDN-detected network (PawaPay rejects provider ≠ phone network).
 * Returns short method key; use `toPawapayProviderId` for API calls.
 */
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

/** @alias resolveFreshpayMethod — same MSISDN preference for PawaPay. */
export const resolvePawapayProvider = resolveFreshpayMethod;

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
