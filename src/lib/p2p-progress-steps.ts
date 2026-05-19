import type { StepState, TxStep } from "@/lib/transaction-steps";
import { isP2pCryptoQuoteCurrency } from "@/lib/p2p-config";

type P2pStepKey = Extract<
  TxStep["labelKey"],
  | "p2p_step_created_short"
  | "p2p_step_escrow_short"
  | "p2p_step_pay_short"
  | "p2p_step_paid_short"
  | "p2p_step_release_short"
  | "p2p_step_done_short"
  | "p2p_step_pay_wallet_short"
  | "p2p_step_settled_short"
>;

function withStates(
  labels: P2pStepKey[],
  activeIndex: number,
  failed = false,
): TxStep[] {
  return labels.map((labelKey, i) => {
    let state: StepState = "pending";
    if (failed && i === activeIndex) state = "failed";
    else if (i < activeIndex) state = "done";
    else if (i === activeIndex) state = failed ? "failed" : "active";
    return { id: labelKey, labelKey, state };
  });
}

const FIAT_LABELS: P2pStepKey[] = [
  "p2p_step_created_short",
  "p2p_step_escrow_short",
  "p2p_step_pay_short",
  "p2p_step_paid_short",
  "p2p_step_release_short",
  "p2p_step_done_short",
];

const CRYPTO_LABELS: P2pStepKey[] = [
  "p2p_step_created_short",
  "p2p_step_escrow_short",
  "p2p_step_pay_wallet_short",
  "p2p_step_settled_short",
];

/** Fiat quote P2P order lifecycle → horizontal stepper states. */
export function p2pFiatOrderProgressSteps(status: string): TxStep[] {
  switch (status) {
    case "awaiting_payment":
      return withStates(FIAT_LABELS, 2);
    case "paid":
      return withStates(FIAT_LABELS, 4);
    case "disputed":
      return withStates(FIAT_LABELS, 4, true);
    case "released":
      return withStates(FIAT_LABELS, FIAT_LABELS.length);
    case "refunded":
      return withStates(FIAT_LABELS, FIAT_LABELS.length - 1, true);
    case "cancelled":
    case "expired":
      return withStates(FIAT_LABELS, 2, true);
    default:
      return withStates(FIAT_LABELS, 0);
  }
}

/** Crypto-quote orders settle on-platform (often instant → released). */
export function p2pCryptoOrderProgressSteps(status: string): TxStep[] {
  switch (status) {
    case "released":
      return withStates(CRYPTO_LABELS, CRYPTO_LABELS.length);
    case "refunded":
      return withStates(CRYPTO_LABELS, CRYPTO_LABELS.length - 1, true);
    case "disputed":
      return withStates(CRYPTO_LABELS, 2, true);
    case "cancelled":
    case "expired":
      return withStates(CRYPTO_LABELS, 2, true);
    default:
      return withStates(CRYPTO_LABELS, 0);
  }
}

export function p2pOrderProgressSteps(status: string, quoteCurrency: string): TxStep[] {
  return isP2pCryptoQuoteCurrency(quoteCurrency)
    ? p2pCryptoOrderProgressSteps(status)
    : p2pFiatOrderProgressSteps(status);
}

/** Preview on trade page before order exists. */
export function p2pTradePreviewSteps(quoteCurrency: string): TxStep[] {
  const labels = isP2pCryptoQuoteCurrency(quoteCurrency) ? CRYPTO_LABELS : FIAT_LABELS;
  return withStates(labels, 0);
}
