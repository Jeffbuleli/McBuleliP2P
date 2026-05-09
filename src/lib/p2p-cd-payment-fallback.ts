/**
 * When `p2p_payment_method_defs` has no rows for CD (e.g. migrations not applied),
 * still offer PawaPay-aligned corridor codes so Profile → payment methods works.
 */
export type P2pMethodDefRow = {
  code: string;
  label: string;
  countryCode: string;
};

export const P2P_CD_PAYMENT_METHOD_FALLBACK: P2pMethodDefRow[] = [
  { code: "AIRTEL_COD", label: "Airtel Money (RDC)", countryCode: "CD" },
  { code: "ORANGE_COD", label: "Orange Money (RDC)", countryCode: "CD" },
  { code: "VODACOM_MPESA_COD", label: "Vodacom M-Pesa (RDC)", countryCode: "CD" },
];

const ALLOW = new Set(P2P_CD_PAYMENT_METHOD_FALLBACK.map((x) => x.code));

export function isCdP2pFallbackMethodCode(code: string): boolean {
  return ALLOW.has(code.trim().toUpperCase());
}
