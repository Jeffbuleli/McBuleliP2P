import { DepositStatus, WithdrawalStatus } from "@/lib/status";

export type StepState = "done" | "active" | "pending" | "failed";

export type TxStep = {
  id: string;
  labelKey:
    | "tx_step_address"
    | "tx_step_sent"
    | "tx_step_verify"
    | "tx_step_review"
    | "tx_step_done"
    | "tx_step_queued"
    | "tx_step_processing";
  state: StepState;
};

function withStates(
  labels: TxStep["labelKey"][],
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

/** Deposit: address → sent → verify (txid) → review → done */
export function depositProgressSteps(status: string): TxStep[] {
  const labels: TxStep["labelKey"][] = [
    "tx_step_address",
    "tx_step_sent",
    "tx_step_verify",
    "tx_step_review",
    "tx_step_done",
  ];
  if (status === DepositStatus.FAILED) return withStates(labels, 2, true);
  if (status === DepositStatus.CONFIRMED) return withStates(labels, labels.length, false);
  if (status === DepositStatus.PENDING_VALIDATION) return withStates(labels, 3, false);
  if (status === DepositStatus.AWAITING_TXID) return withStates(labels, 2, false);
  if (status === DepositStatus.AWAITING_TRANSFER) return withStates(labels, 1, false);
  return withStates(labels, 0, false);
}

/** Withdrawal: queued → processing → done */
export function withdrawalProgressSteps(status: string): TxStep[] {
  const labels: TxStep["labelKey"][] = [
    "tx_step_queued",
    "tx_step_processing",
    "tx_step_done",
  ];
  if (status === WithdrawalStatus.REJECTED || status === WithdrawalStatus.FAILED) {
    return withStates(labels, 1, true);
  }
  if (status === WithdrawalStatus.COMPLETED) return withStates(labels, labels.length, false);
  if (status === WithdrawalStatus.PROCESSING) return withStates(labels, 1, false);
  return withStates(labels, 0, false);
}

/** Internal transfer: instant done or failed */
export function transferProgressSteps(done: boolean, failed = false): TxStep[] {
  const labels: TxStep["labelKey"][] = ["tx_step_sent", "tx_step_done"];
  if (failed) return withStates(labels, 0, true);
  if (done) return withStates(labels, labels.length, false);
  return withStates(labels, 0, false);
}

export function progressPercent(steps: TxStep[]): number {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.state === "done").length;
  const active = steps.some((s) => s.state === "active") ? 0.5 : 0;
  return Math.round(((done + active) / steps.length) * 100);
}
