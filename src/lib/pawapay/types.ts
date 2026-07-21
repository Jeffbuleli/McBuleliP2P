/** PawaPay Merchant API v2 — initiation / status / callback shapes (DRC MoMo). */

export type PawapayInitStatus = "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";

export type PawapayFinalStatus =
  | "ACCEPTED"
  | "SUBMITTED"
  | "ENQUEUED"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "DUPLICATE_IGNORED"
  | "PROCESSING";

export type PawapayFailureReason = {
  failureCode?: string;
  failureMessage?: string;
};

export type PawapayInitResponse = {
  depositId?: string;
  payoutId?: string;
  status: PawapayInitStatus | string;
  created?: string;
  failureReason?: PawapayFailureReason;
};

export type PawapayStatusResponse = {
  depositId?: string;
  payoutId?: string;
  status: PawapayFinalStatus | string;
  amount?: string;
  currency?: string;
  country?: string;
  providerTransactionId?: string;
  failureReason?: PawapayFailureReason;
  created?: string;
};

export type PawapayStatusLookupResponse = {
  status?: "FOUND" | "NOT_FOUND" | string;
  data?: PawapayStatusResponse | null;
  depositId?: string;
  payoutId?: string;
  amount?: string;
  currency?: string;
  country?: string;
  providerTransactionId?: string;
  failureReason?: PawapayFailureReason;
};

/** Normalized callback / reconcile payload used by ledger handlers. */
export type PawapayNormalizedCallback = {
  kind: "deposit" | "payout";
  reference: string;
  status: "COMPLETED" | "FAILED" | "PROCESSING";
  currency: string;
  amount: string;
  providerTxId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  rawBody: string;
};
