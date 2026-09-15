/**
 * User-facing money label for AVEC UI.
 * Ledger / wallet asset code stays USDT under the hood.
 */
export const AVEC_MONEY: "USD" | "USDT" =
  process.env.NEXT_PUBLIC_AVEC_MONEY_LABEL === "USDT" ? "USDT" : "USD";

export function avecMoney(
  amount: string | number,
  digits = 2,
): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${AVEC_MONEY}`;
  return `${n.toFixed(digits)} ${AVEC_MONEY}`;
}
