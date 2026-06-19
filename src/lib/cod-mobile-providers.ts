/**
 * DRC mobile money — FreshPay method identifiers.
 */
export type MobileProviderOption = { provider: string; label: string; method: string };

export const COD_MOBILE_FALLBACK: MobileProviderOption[] = [
  { provider: "airtel", label: "Airtel Money", method: "airtel" },
  { provider: "orange", label: "Orange Money", method: "orange" },
  { provider: "mpesa", label: "M-Pesa", method: "mpesa" },
  { provider: "africell", label: "Afrimoney", method: "africell" },
];

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

/** Infer DRC mobile network from MSISDN (243XXXXXXXXX or local). */
export function detectCodMobileMethodFromPhone(input: string): string | null {
  let s = (input ?? "").trim().replace(/[()\s.-]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  while (s.startsWith("0")) s = s.slice(1);
  const local = s.startsWith("243") ? s.slice(3) : s;
  if (local.length < 2) return null;
  if (/^8[123]/.test(local)) return "mpesa";
  if (/^8[459]/.test(local)) return "orange";
  if (/^9[789]/.test(local)) return "airtel";
  if (/^9[01]/.test(local)) return "africell";
  return null;
}

/** FreshPay rejects when `method` ≠ phone network — prefer detected network. */
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
