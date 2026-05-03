/** Deposit lifecycle stored in `deposits.status` */
export const DepositStatus = {
  AWAITING_TRANSFER: "AWAITING_TRANSFER",
  AWAITING_TXID: "AWAITING_TXID",
  PENDING_VALIDATION: "PENDING_VALIDATION",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
} as const;

/** Withdrawal lifecycle — outbound transfers are operator-validated (manual execution). */
export const WithdrawalStatus = {
  /** Queued for McBuleli ops team */
  PENDING_AGENT: "PENDING_AGENT",
  /** Terminal states */
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
