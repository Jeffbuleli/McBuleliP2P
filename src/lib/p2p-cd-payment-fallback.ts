/**
 * @deprecated Use `p2p-payment-method-catalog` — kept for imports.
 */
import {
  getP2pPaymentMethodsForCountry,
  isP2pCatalogMethodCode,
  type P2pMethodDefRow,
} from "@/lib/p2p-payment-method-catalog";

export type { P2pMethodDefRow };

export const P2P_CD_PAYMENT_METHOD_FALLBACK: P2pMethodDefRow[] =
  getP2pPaymentMethodsForCountry("CD");

export function isCdP2pFallbackMethodCode(code: string): boolean {
  return isP2pCatalogMethodCode("CD", code);
}
