/**
 * Subset of PawaPay Merchant API v2 callback payloads.
 * @see https://docs.pawapay.io/v2/api-reference/deposits/deposit-callback
 * @see https://docs.pawapay.io/v2/api-reference/payouts/payout-callback
 */

export type PawapayCallbackStatus = "COMPLETED" | "PROCESSING" | "FAILED";

/** Metadata echoed from initiation — string key/value pairs */
export type PawapayMetadata = Record<string, string>;

export type PawapayDepositCallback = {
  depositId: string;
  status: PawapayCallbackStatus;
  amount: string;
  currency: string;
  country: string;
  payer: unknown;
  created: string;
  customerMessage?: string;
  providerTransactionId?: string;
  failureReason?: unknown;
  metadata?: PawapayMetadata;
};

export type PawapayPayoutCallback = {
  payoutId: string;
  status: PawapayCallbackStatus;
  amount: string;
  currency: string;
  country: string;
  recipient: unknown;
  created: string;
  customerMessage?: string;
  providerTransactionId?: string;
  failureReason?: unknown;
  metadata?: PawapayMetadata;
};

export function isDepositCallback(
  v: Record<string, unknown>,
): v is Record<string, unknown> & { depositId: string } {
  return typeof v.depositId === "string" && v.depositId.length > 0;
}

export function isPayoutCallback(
  v: Record<string, unknown>,
): v is Record<string, unknown> & { payoutId: string } {
  return typeof v.payoutId === "string" && v.payoutId.length > 0;
}
