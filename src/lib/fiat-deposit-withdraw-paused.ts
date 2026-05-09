/**
 * When `FIAT_DEPOSIT_WITHDRAW_PAUSED=true`, USD/CDF mobile-money deposit & withdraw
 * flows are disabled in UI and blocked server-side. USDT/Pi flows are unchanged.
 */
export function isFiatDepositWithdrawPaused(): boolean {
  return process.env.FIAT_DEPOSIT_WITHDRAW_PAUSED === "true";
}
