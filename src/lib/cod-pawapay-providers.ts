/**
 * DRC (COD) mobile money — align with PawaPay provider IDs (no MTN on this corridor).
 * @see https://docs.pawapay.io/v2/docs/providers
 */
export type PawapayProviderOption = { provider: string; label: string };

/** Used when active-config is empty or offline; matches PawaPay naming. */
export const PAWAPAY_COD_FALLBACK: PawapayProviderOption[] = [
  { provider: "AIRTEL_COD", label: "Airtel Money (RDC)" },
  { provider: "ORANGE_COD", label: "Orange Money (RDC)" },
  { provider: "VODACOM_MPESA_COD", label: "Vodacom M-Pesa (RDC)" },
];

const MTN_COD_RE = /^MTN/i;

/** MTN is not supported on DRC in our integration (avoids payout/deposit check failures). */
export function isExcludedCodPawapayProvider(provider: string): boolean {
  const u = provider.trim().toUpperCase();
  return MTN_COD_RE.test(u) || u.includes("MTN_MOMO");
}

export function filterCodPawapayProviders<T extends { provider: string }>(
  opts: T[],
): T[] {
  return opts.filter((o) => !isExcludedCodPawapayProvider(o.provider));
}
