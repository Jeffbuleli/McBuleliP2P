/**
 * User-facing money for e-AVEC (RDC public).
 * Ledger asset for AVEC shares stays USDT under the hood; UI shows Francs congolais.
 */
import { cdfPerOneUsd } from "@/lib/fx";

export const AVEC_MONEY_LABEL = "Fc";
/** @deprecated Use AVEC_MONEY_LABEL — kept for existing AVEC UI imports. */
export const AVEC_MONEY = AVEC_MONEY_LABEL;

/** Convert a USDT-ledger amount to a Fc display string. */
export function avecMoney(
  amountUsdt: string | number,
  digits = 0,
): string {
  const n = typeof amountUsdt === "number" ? amountUsdt : Number(amountUsdt);
  if (!Number.isFinite(n)) return `— ${AVEC_MONEY_LABEL}`;
  const cdf = n * cdfPerOneUsd();
  const rounded =
    digits <= 0 ? Math.round(cdf) : Number(cdf.toFixed(digits));
  return `${rounded.toLocaleString("fr-FR")} ${AVEC_MONEY_LABEL}`;
}

/** Format an amount already in CDF. */
export function avecCdf(amountCdf: string | number): string {
  const n = typeof amountCdf === "number" ? amountCdf : Number(amountCdf);
  if (!Number.isFinite(n)) return `— ${AVEC_MONEY_LABEL}`;
  return `${Math.round(n).toLocaleString("fr-FR")} ${AVEC_MONEY_LABEL}`;
}
