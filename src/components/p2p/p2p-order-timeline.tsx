"use client";

import { TransactionStepper } from "@/components/wallet/transaction-progress";
import { p2pOrderProgressSteps } from "@/lib/p2p-progress-steps";

export function P2pOrderTimeline({
  status,
  quoteCurrency,
}: {
  status: string;
  quoteCurrency: string;
}) {
  const steps = p2pOrderProgressSteps(status, quoteCurrency);
  return <TransactionStepper steps={steps} />;
}
