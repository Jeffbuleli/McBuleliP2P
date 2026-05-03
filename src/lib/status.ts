/** Deposit lifecycle stored in `deposits.status` */
export const DepositStatus = {
  AWAITING_TRANSFER: "AWAITING_TRANSFER",
  AWAITING_TXID: "AWAITING_TXID",
  PENDING_VALIDATION: "PENDING_VALIDATION",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
} as const;

/** Withdrawal lifecycle */
export const WithdrawalStatus = {
  REQUESTED: "REQUESTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
