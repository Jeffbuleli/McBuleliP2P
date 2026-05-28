/** Canonical string to paste in the user's wallet (6 USDT decimals). */
export function formatDepositPayAmount(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw.trim();
  return n.toFixed(6);
}
