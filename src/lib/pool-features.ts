/**
 * Liquidity pool — new deposits disabled by default (product sunset).
 * Set POOL_ENABLED=true on Web + crons only if you re-enable the LP program.
 */
export function poolNewDepositsEnabled(): boolean {
  const v = process.env.POOL_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Pool-backed USDT loans (collateral = LP positions). */
export function poolLoansEnabled(): boolean {
  return poolNewDepositsEnabled();
}
