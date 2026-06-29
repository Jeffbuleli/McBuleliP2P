/**
 * P2P payment networks by country - aligned with common Binance P2P / regional MoMo corridors.
 * Used when `p2p_payment_method_defs` has no DB rows (no seed in repo).
 */

import type { P2pCountryCode } from "@/lib/p2p-config";
import { isExcludedCodMobileProvider } from "@/lib/cod-mobile-providers";

export type P2pMethodCatalogEntry = {
  code: string;
  label: string;
  countryCode: P2pCountryCode;
  kind: "mobile" | "bank" | "wallet";
  sortOrder: number;
};

function m(
  countryCode: P2pCountryCode,
  code: string,
  label: string,
  kind: P2pMethodCatalogEntry["kind"],
  sortOrder: number,
): P2pMethodCatalogEntry {
  return { countryCode, code, label, kind, sortOrder };
}

/** Static catalog - McBuleli P2P corridors. */
export const P2P_PAYMENT_METHOD_CATALOG: P2pMethodCatalogEntry[] = [
  // DR Congo (PawaPay-aligned mobile)
  m("CD", "AIRTEL_COD", "Airtel Money", "mobile", 10),
  m("CD", "ORANGE_COD", "Orange Money", "mobile", 20),
  m("CD", "VODACOM_MPESA_COD", "M-Pesa (Vodacom)", "mobile", 30),
  m("CD", "BANK_CD", "Bank transfer", "bank", 40),

  // Congo (Brazzaville)
  m("CG", "AIRTEL_CG", "Airtel Money", "mobile", 10),
  m("CG", "MTN_MOMO_CG", "MTN MoMo", "mobile", 20),
  m("CG", "BANK_CG", "Bank transfer", "bank", 30),

  // Rwanda
  m("RW", "MTN_MOMO_RW", "MTN MoMo", "mobile", 10),
  m("RW", "AIRTEL_RW", "Airtel Money", "mobile", 20),
  m("RW", "BANK_RW", "Bank transfer", "bank", 30),

  // Burundi
  m("BI", "LUMICASH_BI", "Lumicash", "mobile", 10),
  m("BI", "ECOCASH_BI", "EcoCash", "mobile", 20),
  m("BI", "BANK_BI", "Bank transfer", "bank", 30),

  // Uganda
  m("UG", "MTN_MOMO_UG", "MTN MoMo", "mobile", 10),
  m("UG", "AIRTEL_UG", "Airtel Money", "mobile", 20),
  m("UG", "BANK_UG", "Bank transfer", "bank", 30),

  // Tanzania
  m("TZ", "MPESA_TZ", "M-Pesa", "mobile", 10),
  m("TZ", "TIGO_TZ", "Tigo Pesa", "mobile", 20),
  m("TZ", "AIRTEL_TZ", "Airtel Money", "mobile", 30),
  m("TZ", "BANK_TZ", "Bank transfer", "bank", 40),

  // Senegal
  m("SN", "ORANGE_SN", "Orange Money", "mobile", 10),
  m("SN", "WAVE_SN", "Wave", "mobile", 20),
  m("SN", "FREE_SN", "Free Money", "mobile", 30),
  m("SN", "BANK_SN", "Bank transfer", "bank", 40),

  // Côte d'Ivoire
  m("CI", "ORANGE_CI", "Orange Money", "mobile", 10),
  m("CI", "MTN_CI", "MTN MoMo", "mobile", 20),
  m("CI", "WAVE_CI", "Wave", "mobile", 30),
  m("CI", "MOOV_CI", "Moov Money", "mobile", 40),
  m("CI", "BANK_CI", "Bank transfer", "bank", 50),

  // Cameroon
  m("CM", "ORANGE_CM", "Orange Money", "mobile", 10),
  m("CM", "MTN_CM", "MTN MoMo", "mobile", 20),
  m("CM", "BANK_CM", "Bank transfer", "bank", 30),

  // Nigeria
  m("NG", "BANK_NG", "Bank transfer", "bank", 10),
  m("NG", "OPAY_NG", "OPay", "wallet", 20),
  m("NG", "PALMPAY_NG", "PalmPay", "wallet", 30),
  m("NG", "KUDA_NG", "Kuda", "wallet", 40),

  // Kenya
  m("KE", "MPESA_KE", "M-Pesa", "mobile", 10),
  m("KE", "AIRTEL_KE", "Airtel Money", "mobile", 20),
  m("KE", "BANK_KE", "Bank transfer", "bank", 30),

  // Ghana
  m("GH", "MTN_GH", "MTN MoMo", "mobile", 10),
  m("GH", "VODAFONE_GH", "Vodafone Cash", "mobile", 20),
  m("GH", "AIRTELTIGO_GH", "AirtelTigo Money", "mobile", 30),
  m("GH", "BANK_GH", "Bank transfer", "bank", 40),

  // South Africa
  m("ZA", "BANK_ZA", "Bank transfer", "bank", 10),
  m("ZA", "FNB_ZA", "FNB", "bank", 20),
  m("ZA", "CAPITEC_ZA", "Capitec", "bank", 30),

  // France
  m("FR", "SEPA_FR", "SEPA", "bank", 10),
  m("FR", "REVOLUT_FR", "Revolut", "wallet", 20),
  m("FR", "PAYPAL_FR", "PayPal", "wallet", 30),
  m("FR", "BANK_FR", "Bank transfer", "bank", 40),

  // Belgium
  m("BE", "SEPA_BE", "SEPA", "bank", 10),
  m("BE", "BANK_BE", "Bank transfer", "bank", 20),
  m("BE", "PAYPAL_BE", "PayPal", "wallet", 30),

  // United States
  m("US", "ZELLE_US", "Zelle", "wallet", 10),
  m("US", "VENMO_US", "Venmo", "wallet", 20),
  m("US", "BANK_US", "Bank (ACH/Wire)", "bank", 30),
  m("US", "PAYPAL_US", "PayPal", "wallet", 40),

  // Other / international
  m("OTHER", "BANK_OTHER", "Bank transfer", "bank", 10),
  m("OTHER", "WISE_OTHER", "Wise", "wallet", 20),
  m("OTHER", "PAYPAL_OTHER", "PayPal", "wallet", 30),
];

const byCountry = new Map<P2pCountryCode, P2pMethodCatalogEntry[]>();
for (const entry of P2P_PAYMENT_METHOD_CATALOG) {
  const list = byCountry.get(entry.countryCode) ?? [];
  list.push(entry);
  byCountry.set(entry.countryCode, list);
}

export type P2pMethodDefRow = {
  code: string;
  label: string;
  countryCode: string;
};

export function getP2pPaymentMethodsForCountry(countryCode: string): P2pMethodDefRow[] {
  const cc = countryCode.trim().toUpperCase() as P2pCountryCode;
  let list = byCountry.get(cc) ?? byCountry.get("OTHER") ?? [];
  if (cc === "CD") {
    list = list.filter((e) => !isExcludedCodMobileProvider(e.code));
  }
  return [...list]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, label, countryCode: c }) => ({ code, label, countryCode: c }));
}

export function isP2pCatalogMethodCode(countryCode: string, code: string): boolean {
  const cc = countryCode.trim().toUpperCase();
  const c = code.trim().toUpperCase();
  const list = getP2pPaymentMethodsForCountry(cc);
  return list.some((x) => x.code === c);
}

export function getP2pCatalogMethodLabel(countryCode: string, code: string): string | null {
  const c = code.trim().toUpperCase();
  const hit = getP2pPaymentMethodsForCountry(countryCode).find((x) => x.code === c);
  return hit?.label ?? null;
}

export function getP2pCatalogMethodKind(
  countryCode: string,
  code: string,
): P2pMethodCatalogEntry["kind"] | null {
  const cc = countryCode.trim().toUpperCase() as P2pCountryCode;
  const c = code.trim().toUpperCase();
  const hit = (byCountry.get(cc) ?? []).find((x) => x.code === c);
  return hit?.kind ?? null;
}
