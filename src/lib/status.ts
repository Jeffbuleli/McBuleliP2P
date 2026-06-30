/** Deposit lifecycle stored in `deposits.status` */
export const DepositStatus = {
  AWAITING_TRANSFER: "AWAITING_TRANSFER",
  AWAITING_TXID: "AWAITING_TXID",
  PENDING_VALIDATION: "PENDING_VALIDATION",
  EXPIRED_PENDING_SCAN: "EXPIRED_PENDING_SCAN",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
} as const;

/** Withdrawal lifecycle — manual queue, then claim, then complete/reject. */
export const WithdrawalStatus = {
  /** Awaiting an agent to take the ticket */
  PENDING_AGENT: "PENDING_AGENT",
  /** Waiting in risk queue before execution decision */
  QUEUED: "QUEUED",
  /** Medium risk delayed batch before execution */
  DELAYED_BATCH: "DELAYED_BATCH",
  /** An agent claimed it — others must not process the same payout */
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
