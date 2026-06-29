import type { TxStep } from "@/lib/transaction-steps";

function withStates(
  labels: TxStep["labelKey"][],
  activeIndex: number,
  failed = false,
): TxStep[] {
  return labels.map((labelKey, i) => {
    let state: TxStep["state"] = "pending";
    if (failed && i === activeIndex) state = "failed";
    else if (i < activeIndex) state = "done";
    else if (i === activeIndex) state = failed ? "failed" : "active";
    return { id: labelKey, labelKey, state };
  });
}

/** AVEC creation: submitted → Ops review → active (notification). */
export function groupCreationProgressSteps(status: string): TxStep[] {
  const labels: TxStep["labelKey"][] = [
    "group_step_submitted",
    "group_step_ops",
    "group_step_active",
  ];
  if (status === "active") {
    return withStates(labels, labels.length);
  }
  if (status === "approved") {
    return withStates(labels, 2);
  }
  if (status === "rejected" || status === "suspended" || status === "closed") {
    return withStates(labels, 1, true);
  }
  // pending - waiting on Ops
  return withStates(labels, 1);
}
