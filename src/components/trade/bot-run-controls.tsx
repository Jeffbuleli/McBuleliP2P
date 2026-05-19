"use client";

import { BotFlowBtn } from "@/components/trade/bots-flow-ui";

type Variant = "emerald" | "violet" | "amber";

export function BotRunControls({
  status,
  busy,
  monitoringOpen,
  monitoringLabel,
  startLabel,
  pauseLabel,
  onStart,
  onPause,
  variant = "emerald",
}: {
  status: "active" | "paused" | "none";
  busy: boolean;
  monitoringOpen?: boolean;
  monitoringLabel?: string;
  startLabel: string;
  pauseLabel: string;
  onStart: () => void;
  onPause: () => void;
  variant?: Variant;
}) {
  const active = status === "active";
  const btnVariant =
    variant === "violet" ? "violet" : variant === "amber" ? "amber" : "primary";

  return (
    <div className="mt-4 space-y-2">
      {active && monitoringOpen && monitoringLabel ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {monitoringLabel}
        </p>
      ) : null}
      {!active ? (
        <BotFlowBtn variant={btnVariant} disabled={busy} onClick={onStart}>
          {startLabel}
        </BotFlowBtn>
      ) : (
        <BotFlowBtn variant="ghost" disabled={busy} onClick={onPause}>
          {pauseLabel}
        </BotFlowBtn>
      )}
    </div>
  );
}
