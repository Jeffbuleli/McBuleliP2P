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
